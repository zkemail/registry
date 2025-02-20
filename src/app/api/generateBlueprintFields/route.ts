import { NextResponse } from 'next/server';
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const PROMPT = `You are tasked with creating zkemail parts that will be used to extract specific information from canonicalized email content. Each extraction goal will be represented as a value object containing an array of regex parts that match continuous sections of the email content.

Here is the non canonicalized email content you will be working with:
<email_content>
{{EMAIL_CONTENT}}
</email_content>

The extraction goals for this email are:
<extraction_goals>
{{EXTRACTION_GOALS}}
</extraction_goals>

Your task is to create a JSON structure that defines how to extract this information. The output should be in this format:

\`\`\`json
{
  "values": [
    {
      "name": "descriptive_field_name",
      "parts": [
        {
          "isPublic": boolean,
          "regexDef": "regex_pattern"
        },
        ...
      ],
      "location": "body|subject|from|to",
      "maxLength": number
    }
  ]
}
\`\`\`

Key Requirements:

1. Value Object Structure:
- "name": A descriptive name for the extracted field
- "parts": Array of regex parts that together match the complete field
- "location": Where to look for this field (body, subject, from, to)
- "maxLength": Maximum expected length of the extracted content

2. Parts Array Requirements:
- Each part must be continuous with the next part in the email
- Break the match into public and private sections
- Private parts (isPublic: false) typically match static text
- Public parts (isPublic: true) capture the desired information
- For DKIM signatures: When two signatures are present, ALWAYS use the second one. If only one signature exists, use that one.

3. Regex Pattern Rules:
- JSON special characters need single backslash escape: \\"
- Regex special characters need double backslash escape: \\\\n, \\\\b
- Use non-greedy matches where appropriate: *?, +?
- Consider word boundaries for accuracy: \\\\b
- Use character classes when needed: [^\\\\n]+
- Characters that don't use backslash scape: <, >, /
- For DKIM-related patterns, use this pattern to conditionally match second signature if it exists:
  "(\\\\r\\n|^)dkim-signature:(?:.*?\\\\r\\ndkim-signature:)?"
  This will match either one or two signatures, preferring the second one when available.

4. Rules:
- When asked for email sender, email recipient, email subject or email timestamp, you must use the provide template without modify.

Example:
For extracting a name like "Hi John Smith," you would create:
{
  "values": [
    {
      "name": "recipient_name",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "Hi "
        },
        {
          "isPublic": true,
          "regexDef": "[^,]+"
        },
        {
          "isPublic": false,
          "regexDef": ","
        }
      ],
      "location": "body",
      "maxLength": 64
    }
  ]
}

For extracting a text inside html tags like "<div id=\\"text\\">Hello World!</div" you would create:
{
  "values": [
    {
      "name": "recipient_name",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "<div id=\\"text\\">"
        },
        {
          "isPublic": true,
          "regexDef": "[^<]+"
        },
        {
          "isPublic": false,
          "regexDef": "<"
        }
      ],
      "location": "body",
      "maxLength": 64
    }
  ]
}

For extracting the email sender use exactly:
{
  "values": [
    {
      "name": "email_sender",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "(\\r\\n|^)from:"
        },
        {
          "isPublic": false,
          "regexDef": "([^\\r\\n]+<)?"
        },
        {
          "isPublic": true,
          "regexDef": "[A-Za-z0-9!#$%&'\\\\*\\\\+-/=\\\\?\\\\^_\`{\\\\|}~\\\\.]+@[A-Za-z0-9\\\\.-]+"
        },
        {
          "isPublic": false,
          "regexDef": ">?\\r\\n"
        }
      ],
      "location": "from",
      "maxLength": 64
    }
  ]
}

For extracting the email recipient use exactly:
{
  "values": [
    {
      "name": "email_recipient",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "(\\r\\n|^)to:"
        },
        {
          "isPublic": false,
          "regexDef": "([^<\r\n]*?\\s*)?<?"
        },
        {
          "isPublic": true,
          "regexDef": "[a-zA-Z0-9!#$%&'\\\\*\\\\+-/=\\\\?\\\\^_\`{\\\\|}~\\\\.]+@[a-zA-Z0-9_\\\\.-]+"
        },
        {
          "isPublic": false,
          "regexDef": ">?\\r\\n"
        }
      ],
      "location": "to",
      "maxLength": 64
    }
  ]
}

For extracting the email subject use exactly:
{
  "values": [
    {
      "name": "email_subject",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "(\\r\\n|^)subject:"
        },
        {
          "isPublic": true,
          "regexDef": "[^\\r\\n]+"
        },
        {
          "isPublic": false,
          "regexDef": "\\r\\n"
        }
      ],
      "location": "subject",
      "maxLength": 64
    }
  ]
}

For extracting the email timestamp use exactly:
{
  "values": [
    {
      "name": "email_timestamp",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "(\\r\\n|^)dkim-signature:"
        },
        {
          "isPublic": false,
          "regexDef": "([a-z]+=[^;]+; )+t="
        },
        {
          "isPublic": true,
          "regexDef": "[0-9]+"
        },
        {
          "isPublic": false,
          "regexDef": ";"
        }
      ],
      "location": "timestamp",
      "maxLength": 64
    }
  ]
}

For extracting DKIM signatures, follow these priority rules:
1. If multiple DKIM signatures exist, exclude any that are from amazonses
2. Among the remaining signatures, select the one where the domain has the most overlapping contiguous characters with the sender's email domain
3. If there's still a tie, use the first matching signature

The DKIM signature pattern should use exactly:
{
  "values": [
    {
      "name": "dkim_signature",
      "parts": [
        {
          "isPublic": false,
          "regexDef": "(\\r\\n|^)dkim-signature:[^\\r\\n]*?d="
        },
        {
          "isPublic": true,
          "regexDef": "[^;\\r\\n]+"
        },
        {
          "isPublic": false,
          "regexDef": ";"
        }
      ],
      "location": "dkim",
      "maxLength": 128
    }
  ]
}

For each extraction goal, please:
1. Create a value object with appropriate name
2. Break the match into logical public/private parts
3. Specify the correct location
4. Set a reasonable maxLength (16, 32, 64, 128, 192...)
5. Ensure patterns are specific enough to avoid false matches
6. Test that parts are continuous in the email content

The goal is to create patterns that reliably extract the desired information while clearly separating public and private content.`;

export async function POST(request: Request) {
  try {
    // Extract form data from the request
    const formData = await request.formData();
    const file = formData.get('emlFile') as File;
    const extractionGoals = formData.get('extractionGoals');

    // Validate required fields are present
    if (!file || !extractionGoals) {
      return NextResponse.json(
        { error: 'Missing email file or extraction goals' },
        { status: 400 }
      );
    }

    // Get email content as text and prepare prompt by replacing placeholders
    const emailContent = await file.text();
    const promptWithReplacements = PROMPT
      .replace('{{EMAIL_CONTENT}}', emailContent)
      .replace('{{EXTRACTION_GOALS}}', extractionGoals.toString());

    // Call Claude API to generate regex patterns
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Latest model
      max_tokens: 2000,
      temperature: 0,
      system: "You must create a array with valid zkemail parts JSON. You must create an object for each part asked",
      messages: [
        {
          role: "user",
          content: promptWithReplacements
        }
      ]
    });

    // Ensure the response content is a text block
    if (msg.content[0].type !== 'text') {
      return NextResponse.json([]);
    }

    // Extract JSON from Claude's response using regex
    const jsonMatch = msg.content[0].text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      return NextResponse.json([]);
    }

    // Parse the JSON response
    const parsedData = JSON.parse(jsonMatch[1]);
    
    // Helper function to validate the structure of each part
    const isValidPart = (part: any) => {
      return part && Array.isArray(part.parts) && 
        part.parts.every((p: any) => 
          typeof p.isPublic === 'boolean' &&
          typeof p.regexDef === 'string'
        ) &&
        typeof part.name === 'string' &&
        typeof part.location === 'string' &&
        typeof part.maxLength === 'number';
    };

    // Extract and validate the values array from parsed data
    const data = parsedData.values || [];
    if (!Array.isArray(data) || !data.every(isValidPart)) {
      return NextResponse.json([]);
    }

    // Return the validated data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
