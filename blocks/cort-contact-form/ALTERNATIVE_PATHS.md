# Alternative Path Options for Cort Contact Form

Since the `.da` folder is not visible in your Adobe storefront, here are alternative path options:

## Option 1: Use `library` folder (without `.da`)
**Path in JSON:**
```
https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form.json
```

**Block endpoint:**
```
https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form
```

## Option 2: Use root-level `blocks` folder
**Path in JSON:**
```
https://content.da.live/abhaykhatariya123456/cortpoc/blocks/cort-contact-form.json
```

**Block endpoint:**
```
https://content.da.live/abhaykhatariya123456/cortpoc/blocks/cort-contact-form
```

## Option 3: Create `.da` folder manually
If you want to use the standard `.da` structure:
1. In Adobe's content management system, create a folder named `.da` (note the dot at the beginning - it makes it a hidden folder)
2. Inside `.da`, create a `library` folder
3. Inside `library`, create a `blocks` folder
4. Upload your files there

## How to Create Hidden Folders in Adobe
- In most file systems, folders starting with `.` are hidden
- You may need to enable "Show hidden files" in your file manager
- Or create it via command line/API if available

## Current Configuration
The JSON file is currently set to use **Option 1** (library folder without `.da`).

Update the spreadsheet path column with:
```
https://content.da.live/abhaykhatariya123456/cortpoc/library/blocks/cort-contact-form.json
```

