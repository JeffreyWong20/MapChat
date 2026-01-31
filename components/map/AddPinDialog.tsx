import { useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AddPinDialogProps {
  onAdd: (data: { title: string; description: string; icon: string; color: string }) => void
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function AddPinDialog({
  onAdd,
  open: controlledOpen,
  setOpen: setControlledOpen,
}: AddPinDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setUncontrolledOpen
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📍')
  const [color, setColor] = useState('#FF6B6B')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title, description, icon, color })
    setTitle('')
    setDescription('')
    setIcon('📍')
    setColor('#FF6B6B')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Add Pin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
            After submitting, you will be prompted to click on the map to place your pin.
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={40}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex gap-2 items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Emoji</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                style={{ width: 48 }}
                onFocus={(e) => {
                  // Try to open the emoji picker (native OS)
                  if (navigator.userAgent.includes('Macintosh')) {
                    // macOS shortcut: Cmd+Ctrl+Space
                    window.dispatchEvent(
                      new KeyboardEvent('keydown', {
                        key: ' ',
                        code: 'Space',
                        metaKey: true,
                        ctrlKey: true,
                      }),
                    )
                  }
                  // For Windows, user can use Win+.
                  // Optionally, show a tooltip to guide the user
                  e.target.title =
                    'Tip: Press Cmd+Ctrl+Space (Mac) or Win+. (Windows) to open emoji picker.'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 48, padding: 0 }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="default">
              Add Pin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
