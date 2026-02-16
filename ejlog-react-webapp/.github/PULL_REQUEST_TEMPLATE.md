# Pull Request

## 📝 Description

<!-- Provide a brief description of the changes in this PR -->

## 🎯 Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Configuration change
- [ ] 🔒 Security update

## 🔗 Related Issues

<!-- Link to related issues -->
Closes #
Related to #

## 📋 Checklist

### Code Quality

- [ ] My code follows the code style of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] ESLint passes with no errors (`npm run lint`)

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes (`npm test`)
- [ ] New and existing E2E tests pass locally with my changes (`npx playwright test`)
- [ ] Test coverage remains ≥80% (check with `npm run test:coverage`)

### Accessibility

- [ ] I have verified keyboard navigation works correctly
- [ ] I have added proper ARIA labels where needed
- [ ] I have tested with a screen reader (if UI changes)
- [ ] Color contrast ratios meet WCAG AA standards (if UI changes)
- [ ] Component is accessible (run `npx playwright test tests/accessibility/`)

### Performance

- [ ] I have used React.memo for expensive components (if applicable)
- [ ] I have used useMemo for complex calculations (if applicable)
- [ ] I have not introduced unnecessary re-renders
- [ ] Bundle size impact is acceptable (`npm run build`)

### Security

- [ ] I have sanitized all user inputs
- [ ] I have not introduced security vulnerabilities (`npm audit`)
- [ ] I have followed OWASP best practices
- [ ] Sensitive data is not logged or exposed

### Documentation

- [ ] I have updated the documentation accordingly
- [ ] I have added JSDoc comments to new functions/components
- [ ] I have updated the README if needed
- [ ] I have updated relevant implementation reports if needed

## 🧪 Testing Instructions

<!-- Provide step-by-step instructions for testing this PR -->

### Prerequisites
<!-- List any prerequisites (backend running, specific data, etc.) -->

### Steps to Test
1.
2.
3.

### Expected Behavior
<!-- Describe what should happen -->

### Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## 📊 Performance Impact

<!-- Delete if not applicable -->

### Before
- Bundle size:
- Load time:
- Lighthouse score:

### After
- Bundle size:
- Load time:
- Lighthouse score:

## 🔒 Security Considerations

<!-- Delete if not applicable -->
<!-- Describe any security implications of this change -->

## 💡 Additional Context

<!-- Add any other context about the PR here -->

## 📱 Browser Testing

<!-- Mark browsers where you've tested this change -->

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## ✅ Final Checks Before Submitting

- [ ] I have read the [DEVELOPMENT.md](../DEVELOPMENT.md) guide
- [ ] I have followed the [Code Style Guidelines](../DEVELOPMENT.md#code-style)
- [ ] All CI/CD checks will pass (quality, security, tests, build)
- [ ] This PR is ready for review

---

**Reviewer Notes**:
<!-- Area for reviewers to add notes -->
