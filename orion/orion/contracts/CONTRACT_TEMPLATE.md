# CONTRACT.md — Module Contract Template

<!--
Every ORION module MUST include a CONTRACT.md in its directory.
This file is both machine-parseable (via YAML frontmatter) and human-readable.
The ORION registry validates this contract before module activation.
-->

```yaml
---
module:
  name: "<module-name>"
  version: "0.1.0"
  description: "<one-line description>"
  author: "LoveLogicAI LLC"

mcp_tools:
  - name: "<tool-name>"
    description: "<what it does>"
    parameters:
      param1:
        type: string
        required: true
      param2:
        type: object
        required: false

event_subscriptions:
  - "<event.name.pattern>"

event_emissions:
  - name: "<event.name>"
    description: "<when this event is emitted>"
    payload_schema:
      field1: string
      field2: number

revenue_surfaces:
  - name: "<surface-name>"
    type: "subscription|transaction|api_call"
    description: "<how revenue is generated>"

api_endpoints:
  - method: GET
    path: "/modules/<name>/endpoint"
    description: "<what it returns>"
---
```

## Overview

_Describe the module's purpose and how it fits into the ORION ecosystem._

## Architecture

_Mermaid diagram or text description of internal components._

## Dependencies

_List any spine services or other modules this depends on._

## Event Flows

_Describe how events flow in and out of this module._
