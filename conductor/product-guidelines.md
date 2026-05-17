# Product Guidelines: Director Hearing Manager

## Design Principles

### Visual Aesthetic: Professional & Clean
The interface should maintain a professional, high-contrast aesthetic with a minimal use of color. We rely heavily on Radix UI primitives to ensure accessibility and consistent behavior. Visual elements should be purposeful, avoiding unnecessary decorative flourishes.

### UX Principle: Progressive Disclosure
To minimize cognitive friction (Hick's Law), we utilize progressive disclosure. Complex information and advanced options should be hidden until contextually relevant, simplifying decision-making for the user during intense workflows like inspection ingestion or packet assembly.

## Voice & Tone

### Communication Style: Direct & Technical
Application communication—including banners, alerts, and tooltips—should be direct, technical, and concise. We prioritize clarity and speed, using error codes and precise technical language to inform the user of system states without unnecessary conversational fluff.

## Technical & Architectural Guidelines

### UI Component Strategy: Compositional
New UI components should be built using a compositional approach. Rather than creating monolithic structures, we build complex components by wrapping and composing existing Radix UI primitives and Lucide React icons. This maintains a lean codebase and leverages well-tested foundational elements.

### Layout Consistency
All new features must align with the established **5-Pillar Operational Architecture** (Dashboard, Complaints, Inspections, Enforcement, Locations). Grid layouts, sticky positioning, and navigation patterns should remain consistent across all destinations to leverage the user's existing mental models (Jakob's Law).

### Information Chunking
Following Miller's Law, information should always be chunked into logical fieldsets (e.g., Site Metadata, Owner Details) to prevent cognitive overload. Use clear visual separators and consistent labeling to maintain hierarchy.