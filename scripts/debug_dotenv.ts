
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const envPath = path.resolve(process.cwd(), '.env.local')
// Just try to log dotenv to see what it is
console.log('Dotenv:', dotenv)
try {
    const config = dotenv.parse(fs.readFileSync(envPath))
    console.log('Parsed:', Object.keys(config))
} catch (e) {
    console.error(e)
}
