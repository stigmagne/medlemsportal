'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { createClient } from '@/lib/supabase/client'
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Undo, Redo, Quote } from 'lucide-react'
import { useCallback } from 'react'

export default function RichTextEditor({
    content,
    onChange,
    orgId
}: {
    content: string
    onChange: (html: string) => void
    orgId: string
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-md max-w-full my-4',
                },
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px]',
            },
        },
    })

    const addImage = useCallback(() => {
        const url = window.prompt('URL')
        if (url) {
            editor?.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${orgId}/${fileName}`

        // Upload
        const { error } = await supabase.storage
            .from('campaign_images')
            .upload(filePath, file)

        if (error) {
            console.error('Upload error:', error)
            alert('Kunne ikke laste opp bilde')
            return
        }

        // Get URL
        const { data: { publicUrl } } = supabase.storage
            .from('campaign_images')
            .getPublicUrl(filePath)

        // Insert
        editor?.chain().focus().setImage({ src: publicUrl }).run()

        // Reset input
        e.target.value = ''
    }

    if (!editor) {
        return null
    }

    const Button = ({ onClick, isActive = false, children, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
        >
            {children}
        </button>
    )

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center">
                <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Fet (Cmd+B)"
                >
                    <Bold size={18} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Kursiv (Cmd+I)"
                >
                    <Italic size={18} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Understrek (Cmd+U)"
                >
                    <UnderlineIcon size={18} />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Overskrift"
                >
                    <span className="font-bold text-sm px-1">H1</span>
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Underoverskrift"
                >
                    <span className="font-bold text-sm px-1">H2</span>
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Punktliste"
                >
                    <List size={18} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Nummerert liste"
                >
                    <ListOrdered size={18} />
                </Button>
                <Button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Sitat"
                >
                    <Quote size={18} />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <div className="relative group">
                    <label className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer flex items-center justify-center">
                        <ImageIcon size={18} />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadImage}
                        />
                    </label>
                </div>

                <div className="flex-grow" />

                <Button onClick={() => editor.chain().focus().undo().run()} title="Angre">
                    <Undo size={18} />
                </Button>
                <Button onClick={() => editor.chain().focus().redo().run()} title="Gjenta">
                    <Redo size={18} />
                </Button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 cursor-text" />
        </div>
    )
}
