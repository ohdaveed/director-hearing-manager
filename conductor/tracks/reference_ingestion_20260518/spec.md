# Specification: Reference Hearing Ingestion

## Goal

To review the complete "50 Rizal Street- Directors Hearing Packet.pdf" and ingest its data into the database as a reference example of a high-quality Director's Hearing Packet.

## Scope

- Extract text from "50 Rizal Street- Directors Hearing Packet.pdf" (21MB).
- Use AI to parse the text into structured objects matching the database schema:
  - `locations`
  - `complaints`
  - `inspections`
  - `violations`
  - `chronology`
  - `hearing_packets`
- Insert the structured data into the Supabase database.
- Mark the records as reference examples (e.g., using a specific naming convention or a flag if available, though current schema doesn't have a reference flag, we'll use a clear case number like "REF-50RIZAL").

## Data Model Alignment

The extracted data will be mapped to:

- `complaints.case_number`: "REF-50RIZAL"
- `hearing_packets.packet_status`: "Complete"
- `hearing_packets.packet_type`: "Final"

## Non-Goals

- Real-time packet generation during ingestion.
- Modifying existing hearing packets.
