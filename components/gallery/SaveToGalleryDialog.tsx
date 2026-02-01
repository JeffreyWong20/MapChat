'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMapStore } from '@/stores/mapStore'
import { useChatStore } from '@/stores/chatStore'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface SaveToGalleryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SaveToGalleryDialog({ open, onOpenChange }: SaveToGalleryDialogProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const { elements, viewState, setRequestScreenshot, screenshotResult, setScreenshotResult } = useMapStore()
    const { messages } = useChatStore()

    // Request screenshot when dialog opens
    useEffect(() => {
        if (open) {
            setRequestScreenshot(true)
        } else {
            setRequestScreenshot(false)
            setScreenshotResult(null)
            setTitle('')
            setDescription('')
        }
    }, [open, setRequestScreenshot, setScreenshotResult])

    const handleSave = async () => {
        if (!title) {
            toast.error('Please enter a title')
            return
        }

        setSaving(true)
        try {
            const payload = {
                title,
                description,
                thumbnail: screenshotResult,
                data: {
                    elements,
                    messages,
                    viewState,
                },
            }

            const res = await fetch('/api/examples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Failed to save to gallery')

            toast.success('Saved to gallery!')
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save to Gallery</DialogTitle>
                    <DialogDescription>
                        Save your current map session to the gallery. This will verify the current view as a thumbnail.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Awesome Map"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this map shows..."
                        />
                    </div>
                    {/* Thumbnail Preview */}
                    <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                        {screenshotResult ? (
                            <img src={screenshotResult} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs">Generating preview...</span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !screenshotResult}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
