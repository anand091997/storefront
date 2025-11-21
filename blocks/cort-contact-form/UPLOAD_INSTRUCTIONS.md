# Upload Instructions for Cort Contact Form

## The Problem
The endpoint `https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form` is returning empty content or invalid JSON, causing a parse error.

## Solution

You need to upload **TWO separate files** to Adobe's content system:

### 1. JSON Configuration File
**File:** `cort-contact-form.json`  
**Upload to:** `https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form.json`  
**Content:** This is the JSON file that defines the block in the library.

### 2. Block Content File (Plain Text/Markdown)
**File:** `cort-contact-form-content.txt` (or rename to just `cort-contact-form` without extension)  
**Upload to:** `https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form`  
**Content:** This should be plain text/markdown content (like the hero example shows "# Your heading here")

## Important Notes:

1. **The endpoint URL should return TEXT/MARKDOWN, not JSON**
   - The hero example returns: `# Your heading here`
   - Your endpoint should return the content from `cort-contact-form-content.txt`

2. **Content-Type Header**
   - Make sure the content file is served with `Content-Type: text/plain` or `text/markdown`
   - NOT `application/json`

3. **File Structure in Adobe**
   ```
   library/
     blocks/
       cort-contact-form.json  (JSON config file)
       cort-contact-form      (Plain text content - NO .txt extension when uploaded)
   ```

4. **If you're still getting JSON parse errors:**
   - Check that the file at the endpoint URL actually contains the text content
   - Verify it's not being served as JSON
   - Make sure the file exists and isn't empty

## Testing

After uploading, test the endpoint:
```bash
curl https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form
```

It should return plain text content, NOT JSON.

