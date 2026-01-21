export type Document = {
    id: string
    name: string
    size_bytes: number | null
    access_level: 'public' | 'board' | 'admin'
    created_at: string
    file_path: string
    category?: string
}
