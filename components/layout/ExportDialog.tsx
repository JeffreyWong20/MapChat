'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMapStore } from '@/stores/mapStore'
import { useChatStore } from '@/stores/chatStore'
import { toast } from 'sonner'
import Image from 'next/image'

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
    const {
        elements,
        viewState,
        setRequestScreenshot,
        screenshotResult,
        setScreenshotResult
    } = useMapStore()
    const { messages } = useChatStore()

    const [title, setTitle] = useState('My Map')
    const [description, setDescription] = useState('')
    const [isExporting, setIsExporting] = useState(false)

    // Request screenshot when dialog opens
    useEffect(() => {
        if (open) {
            setRequestScreenshot(true)
            // Reset previous result
            setScreenshotResult(null)
        } else {
            setRequestScreenshot(false)
        }
    }, [open, setRequestScreenshot, setScreenshotResult])

    const handleExport = () => {
        if (!screenshotResult) {
            toast.error('Waiting for map screenshot...')
            return
        }

        setIsExporting(true)

        try {
            const data = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                title,
                description,
                thumbnail: screenshotResult,
                elements,
                messages,
                viewState,
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            a.download = `mapchat-${sanitizedTitle}-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)

            toast.success('Session exported successfully')
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to export session')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Map Session</DialogTitle>
                    <DialogDescription>
                        Save your current map view, elements, and chat history.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="E.g. WW2 Campaign"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this map..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Preview & Thumbnail</Label>
                        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                            {screenshotResult ? (
                                <img
                                    src={screenshotResult}
                                    alt="Map Screenshot"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm">Capturing map...</div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleExport} disabled={!screenshotResult || isExporting}>
                        {isExporting ? 'Exporting...' : 'Export JSON'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
