
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const examplesDir = path.join(process.cwd(), 'data/examples')

        // Create directory if it doesn't exist
        if (!fs.existsSync(examplesDir)) {
            return NextResponse.json({ examples: [] })
        }

        const files = fs.readdirSync(examplesDir).filter(file => file.endsWith('.json'))

        const examples = files.map(filename => {
            const filePath = path.join(examplesDir, filename)
            const content = fs.readFileSync(filePath, 'utf-8')
            try {
                const data = JSON.parse(content)
                return {
                    id: filename.replace('.json', ''),
                    title: data.title || data.meta?.title || filename.replace('.json', ''),
                    description: data.description || data.meta?.description || 'No description available',
                    thumbnail: data.thumbnail || data.meta?.thumbnail || null, // Base64 image
                    data: data, // Return full data for now, or fetch on demand if too large? 
                    // Requirement says "clicking on the example card should load it".
                    // For a simple list, maybe returning full data is wasteful, but let's stick to simple implementation first.
                    // Actually, if thumbnails are large (base64 screenshot), we want to be careful. 
                    // But "Load demo" logic implies immediate availability. 
                    // Let's return full object for simplicity as per requirements.
                }
            } catch (e) {
                console.error(`Error parsing ${filename}:`, e)
                return null
            }
        }).filter(Boolean)

        return NextResponse.json({ examples })
    } catch (error) {
        console.error('Error fetching examples:', error)
        return NextResponse.json({ error: 'Failed to fetch examples' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { title, description, data, thumbnail } = body

        if (!title || !data) {
            return NextResponse.json({ error: 'Title and data are required' }, { status: 400 })
        }

        const examplesDir = path.join(process.cwd(), 'data/examples')
        if (!fs.existsSync(examplesDir)) {
            fs.mkdirSync(examplesDir, { recursive: true })
        }

        // Generate a safe filename
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const filename = `${safeTitle}-${Date.now()}.json`
        const filePath = path.join(examplesDir, filename)

        const exampleData = {
            id: filename.replace('.json', ''),
            title,
            description,
            thumbnail,
            data
        }

        fs.writeFileSync(filePath, JSON.stringify(exampleData, null, 2))

        return NextResponse.json({ success: true, id: exampleData.id })
    } catch (error) {
        console.error('Error saving example:', error)
        return NextResponse.json({ error: 'Failed to save example' }, { status: 500 })
    }
}
