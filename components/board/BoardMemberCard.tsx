
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, Phone } from "lucide-react"

export interface PublicBoardMember {
    position_id: string
    position_type: string
    position_title: string | null
    first_name: string
    last_name: string
    image_url: string | null
    bio: string | null
    public_email: string | null
    public_phone: string | null
    term_start_date: string
    term_end_date: string | null
}

export function BoardMemberCard({ member }: { member: PublicBoardMember }) {
    const name = `${member.first_name} ${member.last_name}`
    const role = member.position_title || member.position_type.charAt(0).toUpperCase() + member.position_type.slice(1)

    return (
        <Card className="h-full overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <CardHeader className="p-0">
                <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                    {member.image_url ? (
                        <img
                            src={member.image_url}
                            alt={name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="text-4xl font-bold text-muted-foreground w-full h-full flex items-center justify-center bg-secondary">
                            {member.first_name[0]}{member.last_name[0]}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                <div>
                    <h3 className="text-xl font-semibold">{name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">{role}</Badge>
                    </div>
                </div>

                {member.bio && (
                    <p className="text-muted-foreground text-sm line-clamp-4 flex-1">
                        {member.bio}
                    </p>
                )}

                <div className="space-y-2 pt-4 text-sm mt-auto border-t">
                    {(member.public_email) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${member.public_email}`} className="hover:text-primary transition-colors truncate">
                                {member.public_email}
                            </a>
                        </div>
                    )}
                    {(member.public_phone) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${member.public_phone}`} className="hover:text-primary transition-colors">
                                {member.public_phone}
                            </a>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
