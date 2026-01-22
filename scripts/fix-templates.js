const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(process.cwd(), 'src', 'data', 'templates.json');

try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);

    let fixed = false;
    const newData = data.map(item => {
        // Check if 'type' is an object with 'type', 'name', 'content'
        if (typeof item.type === 'object' && item.type !== null && item.type.type) {
            console.log('Fixing malformed item:', item.id);
            fixed = true;
            return {
                ...item,
                type: item.type.type,
                name: item.type.name,
                content: item.type.content
            };
        }
        return item;
    });

    if (fixed) {
        fs.writeFileSync(FILE_PATH, JSON.stringify(newData, null, 2));
        console.log('Successfully fixed templates.json');
    } else {
        console.log('No malformed items found.');
    }

} catch (e) {
    console.error('Error:', e);
}
