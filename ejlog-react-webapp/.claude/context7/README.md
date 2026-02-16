# 🧠 Context7 - Elio-React Memory System

Context7 is the intelligent memory system used by **Elio-React** 🔵 to maintain project knowledge, architectural decisions, and lessons learned.

---

## 📁 Structure

```
.claude/context7/
├── README.md           # This file
├── elio-memory.json    # Main memory database
└── backups/            # Timestamped backups (future)
```

---

## 🎯 What Context7 Stores

### 1. Architectural Decisions (ADRs)
Complete records of every architectural choice:
- Problem statement
- Context and constraints
- Decision made
- Rationale and alternatives considered
- Implementation details
- Consequences (positive & negative)
- Verification results

**Example**: ADR-001 documents the CORS fix for embedded Jetty

### 2. Code Patterns
Reusable code snippets and patterns:
- When to use / when not to use
- Benefits and trade-offs
- Complete working examples
- Related patterns

**Example**: PATTERN-001 shows how to register CORS filter in Jetty

### 3. Issues & Solutions
Problem resolution database:
- Root cause analysis
- Symptoms and error messages
- Solution approach
- Lessons learned
- Prevention strategies

**Example**: ISSUE-001 tracks the React-backend connection problem

### 4. Performance Metrics
Baseline and optimization tracking:
- API response times
- Bundle sizes
- Database query performance
- Rendering metrics

### 5. Technical Debt
Identified improvements needed:
- Priority and effort estimates
- Impact assessment
- Proposed solutions
- Status tracking

**Example**: DEBT-001 notes duplicate CORS configuration

### 6. Knowledge Base
Best practices and lessons learned:
- Team conventions
- Technology-specific insights
- Common pitfalls to avoid

---

## 🔍 How Elio-React Uses Context7

### When Making Decisions
Elio-React queries Context7 to:
- Recall past decisions on similar issues
- Check existing patterns before creating new ones
- Avoid repeating past mistakes
- Maintain consistency across codebase

### When Solving Problems
Elio-React uses Context7 to:
- Find solutions to similar issues
- Reference verified patterns
- Access root cause analyses
- Apply lessons learned

### When Providing Recommendations
Elio-React leverages Context7 to:
- Suggest proven patterns
- Reference successful implementations
- Warn about known anti-patterns
- Provide context-aware advice

---

## 📝 Memory Format

### Architectural Decision Record (ADR)
```json
{
  "id": "ADR-XXX",
  "title": "Decision title",
  "date": "YYYY-MM-DD",
  "category": "backend|frontend|infrastructure|security",
  "priority": "high|medium|low",
  "status": "proposed|implemented|deprecated",
  "problem": "What problem are we solving?",
  "context": "What circumstances led to this decision?",
  "decision": "What did we decide?",
  "implementation": {
    "location": "file:line",
    "method": "methodName()",
    "approach": "How we implemented it"
  },
  "rationale": ["Why this approach?"],
  "consequences": {
    "positive": ["Benefits"],
    "negative": ["Trade-offs"]
  },
  "alternatives_considered": [
    {
      "option": "Alternative approach",
      "reason_rejected": "Why we didn't choose this"
    }
  ],
  "verification": {
    "test": "How to verify it works",
    "expected": "Expected results",
    "result": "Actual results"
  },
  "tags": ["tag1", "tag2"]
}
```

### Code Pattern
```json
{
  "id": "PATTERN-XXX",
  "name": "Pattern name",
  "category": "backend|frontend|fullstack",
  "language": "Java|TypeScript|SQL",
  "framework": "Spring|React|etc",
  "use_case": "When to use this pattern",
  "code_snippet": "Complete working code",
  "benefits": ["Why use this"],
  "when_to_use": "Specific scenarios",
  "when_not_to_use": "Anti-patterns",
  "tags": ["tag1", "tag2"]
}
```

### Issue-Solution Pair
```json
{
  "id": "ISSUE-XXX",
  "title": "Issue description",
  "date": "YYYY-MM-DD",
  "category": "integration|performance|security|bug",
  "severity": "critical|high|medium|low",
  "status": "open|in-progress|resolved",
  "error_message": "Actual error text",
  "root_cause": "What caused it",
  "symptoms": ["Observable effects"],
  "solution": {
    "approach": "How we solved it",
    "implementation": "Reference to ADR or code",
    "verification": "How we confirmed the fix"
  },
  "lessons_learned": ["Key takeaways"],
  "prevention": ["How to avoid in future"],
  "related": {
    "adr": "ADR-XXX",
    "pattern": "PATTERN-XXX"
  },
  "tags": ["tag1", "tag2"]
}
```

---

## 🔗 Cross-References

Context7 maintains bidirectional links between:
- Issues → Solutions (ADRs)
- Solutions → Patterns
- Patterns → Related Patterns
- ADRs → Technical Debt
- Technical Debt → Future ADRs

This creates a knowledge graph that Elio-React navigates to provide context-aware recommendations.

---

## 📊 Current Memory State

**Last Updated**: 2025-11-21T22:15:00Z

**Statistics**:
- Architectural Decisions: 1 (ADR-001)
- Code Patterns: 1 (PATTERN-001)
- Issues Resolved: 1 (ISSUE-001)
- Performance Metrics: 1
- Technical Debt Items: 2
- Best Practices: 2
- Lessons Learned: 1

**Project Phase**: Stabilization (25% complete)

**Active Context**: CORS configuration and verification

---

## 🛠️ Maintenance

### Adding New Entries
Elio-React automatically adds entries when:
- An architectural decision is made
- A new pattern is identified
- An issue is resolved
- A metric is measured
- Technical debt is identified

### Updating Entries
Existing entries are updated when:
- Implementation status changes
- New consequences are discovered
- Better solutions are found
- Metrics improve or degrade

### Querying Memory
Elio-React queries Context7 by:
- ID (direct lookup)
- Category (filter by type)
- Tags (semantic search)
- Date range (timeline view)
- Status (active vs historical)

---

## 🌟 Benefits

1. **Consistency**: Decisions are documented and followed
2. **Knowledge Retention**: No loss of context between sessions
3. **Learning**: Past mistakes inform future decisions
4. **Onboarding**: New team members learn from documented decisions
5. **Traceability**: Every decision has a clear rationale
6. **Evolution**: Track how architecture evolves over time

---

## 🚀 Future Enhancements

- [ ] Automatic backup system
- [ ] Version control integration
- [ ] Visual knowledge graph
- [ ] Search by natural language
- [ ] Export to documentation
- [ ] Metrics dashboard
- [ ] Team collaboration features

---

**Maintained by**: Elio-React 🔵
**Version**: 1.0.0
**Last Sync**: Real-time
