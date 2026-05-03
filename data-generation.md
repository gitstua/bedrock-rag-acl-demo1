# Data Generation
We generate synthetic datasets for a variety of reasons
1. Sensitive PII, Health data in real data
1. Cannot obtain enough source data
1. Simplicity - no need to integrate with a complex online data store or API

## Options
1. Deterministic libraries like Faker to create realistic data. Can be configured with the same random seed to generate deterministically
1. LLM generated data - can be more flexible and creative but less deterministic. Can also be used to generate metadata based on the content.
1. Hybrid approach - use LLM to generate metadata and deterministic libraries to generate the contentn based on example data.

## Considerations
1. If using LLMs, consider the cost and time implications of generating large datasets.
1. Ensure that the generated data is sufficiently realistic for your use case, especially if it will be used for training or testing machine learning models.
1. If using deterministic libraries, ensure that the generated data is diverse enough to cover a wide range of scenarios and edge cases.
1. Consider the ethical implications of generating synthetic data, especially if it is based on real data or could be mistaken for real data. Always include clear disclaimers that the data is synthetic and should not be used for any real-world applications without proper validation.

## Output formats
1. JSON - easy to work with in code and can be easily transformed into other formats if needed.
1. CSV - can be easily opened in spreadsheet software and is widely supported for data analysis.
1. Parquet - efficient for large datasets and can be easily read and written using libraries like Apache Arrow or Pandas.

## Data for this demo
For this demo, we use a hybrid approach. We use a deterministic script to generate the email content based on `source-content.json`, and we use an LLM to generate the metadata based on the content. The metadata includes fields like `from`, `to`, `cc`, `subject`, `date`, and `userAccess`. The `userAccess` field is generated based on the `from`, `to`, and `cc` fields, meaning that anyone who is in those fields has access to the email record. This allows us to demonstrate ACL-based retrieval in the demo.

## Challenges for generation of metadata for vector stores
1. Ensuring that the metadata is consistent with the body and subject of the email. For example, if the email mentions a specific city, the metadata should reflect that.
1. Generating realistic `userAccess` lists based on the `from`, `to`, and `cc` fields. This is important for demonstrating ACL-based retrieval in the demo.
1. Balancing the amount of metadata generated. Too little metadata may not provide enough information for filtering, while too much metadata may make the dataset unnecessarily complex, increase the cost of storage and retrieval or exceed the amount of metadata that can be stored in the vector store. In this demo, we generate a moderate amount of metadata to allow for some filtering while keeping the dataset manageable.
