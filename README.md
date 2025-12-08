# Medical Bill Analyzer

AI-powered medical bill analysis application that uses Claude's vision API to extract and analyze medical bills for errors. This is a demo/validation prototype with no data persistence - each session is independent.

## Features

- **Bill Upload**: Drag-and-drop or click to upload medical bills (PDF, JPEG, PNG)
- **Vision-Based Extraction**: Uses Claude's vision capabilities to read bill data from images
- **Plain English Explanations**: Translates complex medical codes into understandable language
- **Error Detection**: Automatically identifies billing errors including:
  - Duplicate charges
  - Unbundling violations
  - No Surprises Act violations
  - Balance billing
  - Math errors
  - Upcoding
  - Invalid codes
- **Professional Dispute Letters**: Generates ready-to-send dispute letters
- **Responsive Design**: Optimized for desktop and tablet (minimum 1024px width)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Provider**: Anthropic Claude API
- **Deployment**: Local development (npm run dev)
- **Data**: No database - everything in-memory/session-based

## Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```bash
# Use a single API key for all operations (recommended)
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload a Medical Bill

- Navigate to the home page
- Drag and drop a medical bill image/PDF, or click to select a file
- Supported formats: PDF, JPEG, PNG (max 10MB)
- Click "Analyze Bill"

### 2. Analysis Process

The application will process your bill in 4 steps (20-35 seconds total):

1. **Reading Your Bill** - Extracts text and data
2. **Understanding Line Items** - Translates medical codes
3. **Checking for Billing Errors** - Analyzes for errors
4. **Finalizing Results** - Prepares your report

### 3. Review Results

- View itemized bill with plain English explanations
- See potential savings and error summary
- Click on line items with errors to see details

### 4. Generate Dispute Letter

- Click "Generate Dispute Letter"
- Review the professional dispute letter
- Copy to clipboard, print, download, or email

## Project Structure

```
medical-bill-analyzer/
├── app/
│   ├── page.tsx                    # Screen 1: Upload
│   ├── analyzing/page.tsx          # Screen 2: Processing
│   ├── results/page.tsx            # Screen 3: Bill view
│   ├── errors/page.tsx             # Screen 4: Error details
│   ├── dispute/page.tsx            # Screen 5: Letter
│   └── api/
│       ├── extract/route.ts        # Vision API endpoint
│       ├── explain/route.ts        # Explanation API endpoint
│       └── analyze/route.ts        # Error detection API endpoint
├── components/
│   ├── ErrorCard.tsx
│   ├── LineItem.tsx
│   ├── ProcessingStep.tsx
│   └── BreakpointWarning.tsx
└── lib/
    ├── types.ts                    # TypeScript interfaces
    ├── anthropic.ts                # API client wrapper
    └── BillContext.tsx             # Session state management
```

## API Architecture

The application makes 3 separate API calls to Claude:

1. **Extract Bill Data** - Uses Claude with vision to extract structured data
2. **Explain Line Items** - Translates medical codes to plain English
3. **Analyze for Errors** - Detects 7 types of billing errors

**Cost per analysis**: $0.05 - $0.15

## Important Notes

### No Data Persistence

- All data is stored in React Context (memory only)
- Data is lost on page refresh
- No database or backend storage

### Minimum Screen Size

- Application requires 1024px minimum width
- Warning banner shown on smaller screens

### File Limitations

- Maximum file size: 10MB
- Supported formats: PDF, JPEG, PNG

## Troubleshooting

### "No API key found" error

Make sure you've created `.env.local` with your Anthropic API key and restarted the dev server.

### "Failed to extract bill data" error

- Ensure the image is clear and readable
- Check that the file size is under 10MB
- Verify your API key has sufficient credits

## Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

Built with Next.js 14, TypeScript, Tailwind CSS, and Anthropic Claude API
