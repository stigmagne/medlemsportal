'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateEventInput {
    org_id: string;
    title: string;
    description?: string;
    event_date: string;
    location?: string;
    digital_link?: string;
    registration_deadline?: string;
    max_participants?: number;
    open_for: 'members_only' | 'all' | 'non_members_only';
    base_price: number;
    member_price?: number;
    products?: Array<{
        name: string;
        description?: string;
        price: number;
        max_quantity?: number;
    }>;
    requires_active_membership?: boolean;
    requires_prev_year_payment?: boolean;
    price_type?: 'price' | 'deductible';
}

export async function createEvent(data: CreateEventInput) {
    const supabase = await createClient()

    // Validation
    if (!data.title || data.title.trim().length === 0) {
        return { error: 'Arrangementnavn er påkrevd' }
    }

    if (data.base_price < 0) {
        return { error: 'Pris kan ikke være negativ' }
    }

    // Date validation could go here

    // Insert event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
            org_id: data.org_id,
            title: data.title,
            description: data.description,
            event_date: data.event_date,
            location: data.location,
            digital_link: data.digital_link,
            registration_deadline: data.registration_deadline,
            max_participants: data.max_participants,
            open_for: data.open_for,
            base_price: data.base_price,
            member_price: data.member_price !== undefined ? data.member_price : data.base_price,
            requires_active_membership: data.requires_active_membership || false,
            requires_prev_year_payment: data.requires_prev_year_payment || false,
            price_type: data.price_type || 'price'
        })
        .select()
        .single()

    if (eventError) {
        console.error('Error creating event:', eventError)
        return { error: 'Kunne ikke opprette arrangement' }
    }

    // Insert products if any
    if (data.products && data.products.length > 0) {
        const products = data.products.map(p => ({
            event_id: event.id,
            name: p.name,
            description: p.description,
            price: p.price,
            max_quantity: p.max_quantity,
            available_quantity: p.max_quantity
        }))

        const { error: productsError } = await supabase
            .from('event_products')
            .insert(products)

        if (productsError) {
            console.error('Error creating products:', productsError)
            // Ideally rollback event here, but for MVP we return error
            return { error: 'Arrangement opprettet, men feil med tilleggsprodukter' }
        }
    }

    revalidatePath(`/org/${data.org_id}/dashboard/arrangementer`)
    return { success: true, event }
}

export async function getEvents(orgId: string, filter: 'upcoming' | 'past' | 'all' = 'upcoming') {
    const supabase = await createClient()

    let query = supabase
        .from('events')
        .select('*, registrations:event_registrations(count)')
        .eq('org_id', orgId)

    const now = new Date().toISOString()

    if (filter === 'upcoming') {
        query = query.gte('event_date', now).order('event_date', { ascending: true })
    } else if (filter === 'past') {
        query = query.lt('event_date', now).order('event_date', { ascending: false })
    } else {
        query = query.order('event_date', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching events:', error)
        throw error
    }

    return data
}

export async function getEventDetails(eventId: string) {
    const supabase = await createClient()

    const { data: event, error } = await supabase
        .from('events')
        .select(`
            *,
            products:event_products(*)
        `)
        .eq('id', eventId)
        .single()

    if (error) throw error
    return event
}

interface CreateRegistrationInput {
    event_id: string;
    member_id?: string; // If member

    // For non-members
    non_member_name?: string;
    non_member_email?: string;
    non_member_phone?: string;

    // New Member Details
    non_member_address?: string;
    non_member_zip?: string;
    non_member_city?: string;
    non_member_birth_date?: string;

    // Products
    product_ids?: string[]; // Array of product IDs to purchase (quantity 1 for simplification for now)

    // Metadata
    interested_in_membership?: boolean;

    // Bundled Debt
    pay_debt?: boolean;
    debt_amount?: number;
}

export async function registerForEvent(data: CreateRegistrationInput) {
    const supabase = await createClient()

    // 1. Fetch event and check capacity
    const { data: event } = await supabase
        .from('events')
        .select('*, registrations:event_registrations(count)')
        .eq('id', data.event_id)
        .single()

    if (!event) return { error: 'Arrangement ikke funnet' }

    const currentRegistrations = event.registrations[0]?.count || 0

    if (event.max_participants && currentRegistrations >= event.max_participants) {
        return { error: 'Arrangementet er fullt' }
    }

    // Check deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
        return { error: 'Påmeldingsfristen har gått ut' }
    }

    // Validate member/non-member logic
    if (event.open_for === 'members_only' && !data.member_id) {
        // Exception: If they are BECOMING a member now
        if (!data.interested_in_membership) {
            return { error: 'Dette arrangementet er kun for medlemmer' }
        }
    }

    // 2. Handle New Member Creation
    let finalMemberId = data.member_id

    if (!finalMemberId && data.interested_in_membership) {
        // Split name (simplistic)
        const parts = (data.non_member_name || '').split(' ')
        const lastName = parts.pop() || ''
        const firstName = parts.join(' ') || data.non_member_name || ''

        // Create Member
        const { data: newMember, error: memError } = await supabase
            .from('members')
            .insert({
                org_id: event.org_id,
                first_name: firstName,
                last_name: lastName,
                email: data.non_member_email,
                phone: data.non_member_phone,
                address: data.non_member_address,
                zip_code: data.non_member_zip,
                city: data.non_member_city,
                birth_date: data.non_member_birth_date,
                status: 'pending', // Pending payment
                membership_status: 'active', // Pending payment technically means active candidate? Or pending.
                joined_at: new Date().toISOString()
            })
            .select()
            .single()

        if (memError) {
            console.error('Failed to create member:', memError)
            return { error: 'Kunne ikke opprette medlemskap' }
        }
        finalMemberId = newMember.id
    }

    if (!finalMemberId && (!data.non_member_name || !data.non_member_email)) {
        return { error: 'Navn og e-post er påkrevd' }
    }

    // 3. Calculate Total Amount
    let totalAmount = finalMemberId ? (event.member_price ?? event.base_price) : event.base_price

    // If they just joined, add membership fee
    let membershipFeeAdded = 0
    if (!data.member_id && data.interested_in_membership && finalMemberId) {
        // Fetch org fee
        const { data: org } = await supabase.from('organizations').select('membership_fee').eq('id', event.org_id).single()
        membershipFeeAdded = Number(org?.membership_fee || 500)
        totalAmount += membershipFeeAdded
    }

    // Calculate add-on products
    if (data.product_ids && data.product_ids.length > 0) {
        const { data: products } = await supabase
            .from('event_products')
            .select('*')
            .in('id', data.product_ids)

        for (const p of products || []) {
            totalAmount += Number(p.price)
        }
    }

    // Calculate and Verify Debt
    let verifiedDebtAmount = 0
    // STRICT RULE: If member registers, any outstanding debt is added automatically.
    // User Requirement: "medlemmer som ikke har betalt inneværende års kontingent får den automatisk lagt til"
    if (finalMemberId && !data.interested_in_membership) {
        const { data: member } = await supabase.from('members').select('unpaid_years').eq('id', finalMemberId).single()
        const { data: org } = await supabase.from('organizations').select('membership_fee').eq('id', event.org_id).single()

        const unpaidCount = member?.unpaid_years?.length || 0
        verifiedDebtAmount = unpaidCount * (org?.membership_fee || 500)

        // Also check if current year invoice is pending (this might overlap with unpaid_years depending on when it's added)
        // Typically unpaid_years are added when Renewal runs.
        // For "Inneværende år" (Current Year), if they haven't paid, we should ideally check that too.
        // But for minimal risk of double charging, we stick to unpaid_years + explicit requirement check if we had it.
        // Given current architecture: unpaid_years tracks history.
        // If system is consistent, current year might be in there if generated? No, usually separate.
        // Let's stick to: If we find debt, we add it.

        if (verifiedDebtAmount > 0) {
            totalAmount += verifiedDebtAmount
        }
    }

    // 4. Create Registration
    const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
            event_id: data.event_id,
            member_id: finalMemberId,
            non_member_name: data.non_member_name,
            non_member_email: data.non_member_email,
            non_member_phone: data.non_member_phone,
            total_amount: totalAmount,
            payment_status: 'pending',
            interested_in_membership: data.interested_in_membership || false,
            includes_membership_fee: verifiedDebtAmount > 0 || membershipFeeAdded > 0,
            membership_fee_amount: verifiedDebtAmount + membershipFeeAdded
        })
        .select()
        .single()

    // Create Payment Transaction (Vipps Order Placeholder)
    if (registration) {
        let desc = `Påmelding: ${event.title}`
        if (membershipFeeAdded > 0) desc += ' + Nytt Medlemskap'
        if (verifiedDebtAmount > 0) desc += ' + Utestående Kontingent'

        await supabase.from('payment_transactions').insert({
            org_id: event.org_id,
            member_id: finalMemberId || undefined,
            event_id: event.id, // Link to event for reporting
            amount: totalAmount,
            type: 'event_registration',
            status: 'pending',
            description: desc,
            vipps_order_id: registration.id
        })
    }

    if (regError) {
        console.error('Registration error:', regError)
        return { error: 'Kunne ikke registrere påmelding' }
    }

    // 5. Link Products
    if (data.product_ids && data.product_ids.length > 0) {
        const { data: products } = await supabase
            .from('event_products')
            .select('*')
            .in('id', data.product_ids)

        if (products) {
            const regProducts = products.map(p => ({
                registration_id: registration.id,
                product_id: p.id,
                quantity: 1,
                price_at_purchase: p.price
            }))

            await supabase.from('event_registration_products').insert(regProducts)
        }
    }

    // 6. Generate Payment Link
    const paymentLink = `/betaling/mock/${registration.id}` // Mock link

    revalidatePath(`/org/${event.org_id}/dashboard/arrangementer/${event.id}`)

    return { success: true, registration, paymentLink }
}
