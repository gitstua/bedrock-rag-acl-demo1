# Architecture

## Purpose
This repository demonstrates a manual Retrieval-Augmented Generation (RAG) pattern with metadata-aware filtering and access control hints for synthetic email data.

The deployment pattern uses:
- Amazon S3 for source documents
- Amazon Bedrock Knowledge Bases for ingestion, chunking, embeddings, and retrieval
- A vector store configured through the Knowledge Base setup
- AWS Lambda as a lightweight query API that calls Bedrock and returns HTML

## Deployment Pattern
The current manual deployment flow is:
1. Create an S3 bucket.
2. Upload the generated files from `sampledata/`.
3. Create a Bedrock Knowledge Base.
4. Add the S3 bucket as the document source.
5. Configure the vector store with chunk size 400 and overlap 20.
6. Deploy a Lambda function with Bedrock access.
7. Connect Lambda to the Knowledge Base / vector retrieval path.
8. Expose Lambda with a Function URL for demo access.
9. Grant IAM permissions for Lambda to call Bedrock and access the vector retrieval path.

## High-Level Diagram

```
+-------------------------+         +----------------------------+
| source-content.json     |         | generate-email-pairs.js    |
| (seed content)          | ----->  | creates synthetic emails   |
+-------------------------+         +----------------------------+
                                              |
                                              v
                                 +----------------------------+
                                 | sampledata/                |
                                 | emailN.json + metadata     |
                                 +----------------------------+
                                              |
                                              v
                                 +----------------------------+
                                 | Amazon S3 Bucket           |
                                 | uploaded demo documents    |
                                 +----------------------------+
                                              |
                                              v
+----------------------------+     ingest/chunk/embed    +---------------------------+
| Bedrock Knowledge Base     | <------------------------ | S3 data source            |
| chunk=400, overlap=20      |                           +---------------------------+
| metadata-aware retrieval   |
+----------------------------+
              ^
              | retrieve relevant chunks
              |
+----------------------------+      invoke/query      +----------------------------+
| Lambda Function URL        | ---------------------> | AWS Lambda                 |
| (demo endpoint)            | <--------------------- | calls Bedrock, returns HTML|
+----------------------------+        HTML response   +----------------------------+
```

## How Data Gets In
Data ingestion happens in two phases: local generation and cloud indexing.

### 1) Local generation
1. `source-content.json` provides the synthetic source material.
2. Run `node generate-email-pairs.js`.
3. The script writes records to `sampledata/` as paired files:
   - `emailX.json` (content)
   - `emailX.json.metadata.json` (metadata such as ACL-related fields)

By default, the generator creates `email1` through `email300` and intentionally includes many Canberra records so metadata filtering demos return multiple matches.

### 2) Cloud indexing
1. Upload all generated files from `sampledata/` to S3.
2. Configure the Knowledge Base to read from that S3 location.
3. During ingestion, documents are chunked (400 chars, overlap 20), embedded, and indexed in the configured vector backend.
4. Metadata files are associated with documents and become available for retrieval filtering.

## Query and Response Flow
1. A user calls the Lambda Function URL with a prompt.
2. Lambda applies app logic, including user-context-aware filtering assumptions from metadata (for example `userAccess`).
3. Lambda queries Bedrock retrieval against the indexed chunks.
4. Bedrock returns relevant chunks.
5. Lambda summarizes or formats the result and returns HTML to the caller.

## Access and Security Notes
- This demo exposes Lambda with a Function URL for simplicity.
- In a production deployment, add stronger authentication and authorization (for example Cognito, API Gateway authorizers, or private networking).
- Ensure least-privilege IAM for S3 access, Knowledge Base retrieval, and Bedrock model invocation.

## Scope and Limitations
- ACL behavior is represented by metadata conventions (for example `userAccess` derived from to/from/cc) and demo logic.
- Retrieval returns top relevant chunks, not an exhaustive list of all possible matches.
