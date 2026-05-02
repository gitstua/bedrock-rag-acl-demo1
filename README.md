# Manual Demo Files

## Data Generation
- Source content for synthetic email generation is in `source-content.json`.
- Generate or refresh records into `sampledata/` with:
    - `node generate-email-pairs.js`
- Default output is `email1` through `email300` (plus matching metadata files).
- The generator intentionally includes many `Canberra` records so metadata searches can return multiple hits.

## Manual Setup Instructions
To setup using this data:

1. Create S3 bucket
1. Upload files
1. Create a knowledge base
    - Add documents from S3 bucket
    -  Create S3 vector store. Chunk with 400 and overlap by 20
1. Deploy a lambda with Bedrock access and connect to the vector store that returns HTML - I configured a function URL for simplicity - you can authenticate with Cognito or other means if you want to add security
1. Ensure Lambda has permissions to access the vector store and Bedrock model/inference profile

## Future
1. Enhance to filter by more metadata - you could process the prompt to generate the keywords to search the metadata for
1. Consider OpenSearch (hybrid search) or combine:
    * vector search (relevance)
    * keyword search (completeness)
1. Add more metadata and filtering (for example `classification` or `city`/`country`)
1. Extract more metadata from the body using an LLM

## Limitations
1. The `userAccess` is combined based on to/from/cc meaning those people have ACL access to the record. 
1. The demo is not intended to return all results that match a query - it gets the most relevant chunks and summarises these