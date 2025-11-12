# Builder.io Models Setup Guide

**Purpose:** Step-by-step instructions for creating and configuring Builder.io models for AdminWorkBench  
**Estimated Time:** 30-45 minutes  
**Prerequisites:** Builder.io account connected, API credentials obtained

---

## 📋 Models to Create

You'll need to create 5 models in Builder.io:

| Model Name | Purpose | Type |
|-----------|---------|------|
| `admin-workbench-header` | Header and quick actions section | Editor-editable |
| `admin-workbench-metrics` | KPI metrics cards grid | Editor-editable |
| `admin-workbench-sidebar` | Sidebar widgets and filters | Editor-editable |
| `admin-workbench-footer` | Bulk actions panel controls | Editor-editable |
| `admin-workbench-main` | Main container (optional, for full layout override) | Template |

---

## 🎯 Step-by-Step Model Creation

### Model 1: Header (`admin-workbench-header`)

**Purpose:** Edit the header/quick actions section

1. **Create Model:**
   - Login to [builder.io](https://builder.io)
   - Click "Models" in left sidebar
   - Click "+ Create Model"
   - Name: `admin-workbench-header`
   - Display Name: "Admin Workbench Header"
   - Kind: "Reusable template"

2. **Add Fields (Schema):**
   - Click "Edit JSON" or use field editor
   - Define the schema:
   ```json
   {
     "blocks": [
       {
         "id": "string",
         "className": "string",
         "style": "object",
         "content": "string"
       }
     ]
   }
   ```

3. **Create Entry:**
   - Click "Entries" for this model
   - Click "+ New Entry"
   - Name: `main` (important!)
   - Leave content empty for now (we'll add it later)
   - Save & Publish

4. **Set Permissions:**
   - Open model settings
   - Enable "Show in Visual Editor"
   - Save

---

### Model 2: Metrics (`admin-workbench-metrics`)

**Purpose:** Edit KPI metrics cards and layout

1. **Create Model:**
   - Click "+ Create Model"
   - Name: `admin-workbench-metrics`
   - Display Name: "Admin Workbench Metrics"
   - Kind: "Reusable template"

2. **Add Fields (Schema):**
   ```json
   {
     "blocks": [
       {
         "id": "string",
         "className": "string",
         "title": "string",
         "value": "number",
         "trend": "string",
         "icon": "string"
       }
     ]
   }
   ```

3. **Create Entry:**
   - Click "Entries"
   - Click "+ New Entry"
   - Name: `main`
   - Save & Publish

4. **Set Permissions:**
   - Enable "Show in Visual Editor"

---

### Model 3: Sidebar (`admin-workbench-sidebar`)

**Purpose:** Edit sidebar widgets, filters, and analytics

1. **Create Model:**
   - Click "+ Create Model"
   - Name: `admin-workbench-sidebar`
   - Display Name: "Admin Workbench Sidebar"
   - Kind: "Reusable template"

2. **Add Fields (Schema):**
   ```json
   {
     "sections": [
       {
         "title": "string",
         "collapsible": "boolean",
         "collapsed": "boolean",
         "widgets": [
           {
             "type": "string",
             "title": "string",
             "data": "object"
           }
         ]
       }
     ]
   }
   ```

3. **Create Entry:**
   - Click "Entries"
   - Click "+ New Entry"
   - Name: `main`
   - Save & Publish

---

### Model 4: Footer (`admin-workbench-footer`)

**Purpose:** Edit bulk actions panel and footer controls

1. **Create Model:**
   - Click "+ Create Model"
   - Name: `admin-workbench-footer`
   - Display Name: "Admin Workbench Footer"
   - Kind: "Reusable template"

2. **Add Fields (Schema):**
   ```json
   {
     "blocks": [
       {
         "id": "string",
         "className": "string",
         "type": "string",
         "label": "string",
         "action": "string"
       }
     ]
   }
   ```

3. **Create Entry:**
   - Click "Entries"
   - Click "+ New Entry"
   - Name: `main`
   - Save & Publish

---

### Model 5: Main Container (Optional - `admin-workbench-main`)

**Purpose:** Override entire dashboard layout (advanced)

1. **Create Model:**
   - Click "+ Create Model"
   - Name: `admin-workbench-main`
   - Display Name: "Admin Workbench Main"
   - Kind: "Page template"

2. **Add Fields (Schema):**
   ```json
   {
     "headerContent": {
       "type": "reference",
       "model": "admin-workbench-header"
     },
     "metricsContent": {
       "type": "reference",
       "model": "admin-workbench-metrics"
     },
     "sidebarContent": {
       "type": "reference",
       "model": "admin-workbench-sidebar"
     },
     "footerContent": {
       "type": "reference",
       "model": "admin-workbench-footer"
     }
   }
   ```

3. **Create Entry:**
   - Click "Entries"
   - Click "+ New Entry"
   - Name: `main`
   - Reference the other models if desired
   - Save & Publish

---

## ✏️ Editing Content in Builder.io

### Adding Content to Header

1. Navigate to Models → `admin-workbench-header` → Entries → `main`
2. Click "Edit in Visual Editor"
3. Add sections:
   - Action buttons (Add User, Import, Export)
   - Search bar
   - Filter shortcuts
4. Customize styling:
   - Colors, spacing, fonts
   - Responsive breakpoints
5. Click "Publish"

### Adding Metrics to Metrics Section

1. Navigate to Models → `admin-workbench-metrics` → Entries → `main`
2. Click "Edit in Visual Editor"
3. Add metric cards:
   - Total Users
   - Pending Approvals
   - Active Workflows
   - Due This Week
4. Configure for each card:
   - Title
   - Icon
   - Value (will be fetched from API)
   - Trend indicator
5. Click "Publish"

### Configuring Sidebar Widgets

1. Navigate to Models → `admin-workbench-sidebar` → Entries → `main`
2. Click "Edit in Visual Editor"
3. Add sections (expandable/collapsible):
   - **Filters:** Role, Status, Department, Date Range
   - **Analytics:** Charts, activity feed
   - **Shortcuts:** Quick filters
4. Enable/disable widgets as needed
5. Click "Publish"

### Setting up Footer Actions

1. Navigate to Models → `admin-workbench-footer` → Entries → `main`
2. Click "Edit in Visual Editor"
3. Add action controls:
   - Bulk action type selector
   - Bulk action value selector
   - Preview button
   - Apply/Cancel buttons
4. Configure styling and layout
5. Click "Publish"

---

## 🧪 Testing Models

### Test 1: Verify Content API

```bash
# Replace YOUR_API_KEY and YOUR_SPACE with your credentials
curl "https://cdn.builder.io/api/v3/content/admin-workbench-header?apiKey=YOUR_API_KEY&space=YOUR_SPACE"

# You should get a response with your content
```

### Test 2: Check Dashboard Loading

1. Set environment variables:
```bash
NEXT_PUBLIC_BUILDER_API_KEY=your_key
NEXT_PUBLIC_BUILDER_SPACE=your_space
```

2. Restart dev server

3. Navigate to `/admin/users`

4. Open browser DevTools → Network tab

5. Look for requests to `/api/builder-io/content`

6. Verify responses contain your Builder.io models

### Test 3: Verify Fallback

1. Disable Builder.io (remove env variables)

2. Restart dev server

3. Navigate to `/admin/users`

4. Verify default components still render

5. Re-enable Builder.io variables

---

## 🔄 Updating Content

### Publishing Changes

1. Edit model in Visual Editor
2. Click "Publish"
3. Changes go live within 5 minutes (CDN cache)
4. Dashboard automatically fetches new content

### Version History

- Builder.io tracks all versions
- You can revert to previous versions
- Rollback is instant

### Scheduled Publishing (if available)

- Some Builder.io plans support scheduling
- Schedule content updates for specific dates/times
- Useful for marketing campaigns

---

## 📊 Content Best Practices

### Performance Tips

1. **Keep content simple:** Fewer blocks = faster rendering
2. **Use appropriate media sizes:** Optimize images
3. **Minimize custom CSS:** Use Builder.io theming
4. **Cache strategy:** 5-minute cache is default

### Maintainability Tips

1. **Use consistent naming:** `main` for main entries
2. **Document changes:** Add notes in descriptions
3. **Test before publishing:** Use preview mode first
4. **Monitor performance:** Watch LCP in Lighthouse

### Accessibility Tips

1. **Add alt text:** For all images
2. **Use semantic HTML:** Proper heading hierarchy
3. **Color contrast:** Verify 4.5:1 for text
4. **Labels:** All inputs must have labels
5. **Keyboard nav:** Ensure all elements are keyboard accessible

---

## 🚀 Advanced Features

### Dynamic Content References

Reference other models to build hierarchies:

```json
{
  "metrics": {
    "type": "reference",
    "model": "admin-workbench-metrics"
  }
}
```

### Conditional Rendering

Some Builder.io plans support conditional content:
- Show/hide based on user role
- Show/hide based on feature flags
- Show/hide based on device

### Custom Components

If needed, extend with custom React components:
1. Register custom component in Builder.io
2. Use in builder editor
3. Render in your app with custom handler

---

## 🔒 Security & Permissions

### API Key Security

- Public API key: Safe in frontend code
- Private API key: Keep in backend only
- Rotate keys quarterly
- Monitor usage in Builder.io dashboard

### Content Permissions

- Restrict who can edit each model
- Use Builder.io's role system
- Admin editors only for critical sections
- Use approval workflows if available

### Content Validation

- All content is validated before rendering
- XSS prevention built-in
- CSP headers protect against scripts
- Sanitize any user-generated content

---

## ⚠️ Troubleshooting

### Models not showing in app

1. Check if `NEXT_PUBLIC_BUILDER_API_KEY` is set
2. Check if `NEXT_PUBLIC_BUILDER_SPACE` is set
3. Verify model names match exactly (case-sensitive)
4. Ensure entries are published
5. Clear browser cache

### Content showing but looks wrong

1. Check if CSS classes are correct
2. Verify tailwind classes are available
3. Check z-index conflicts
4. Test on different screen sizes
5. Check dark mode support

### API returns 404

1. Verify API key is correct
2. Verify space ID is correct
3. Ensure model entry is named `main`
4. Check entry is published
5. Try different model name

---

## 📞 Getting Help

### Builder.io Resources

- [Builder.io Docs](https://www.builder.io/docs)
- [API Documentation](https://www.builder.io/docs/content-api)
- [Discord Community](https://discord.gg/VkExqD6KqN)
- [Support](https://builder.io/support)

### Project Resources

- [BUILDER_IO_INTEGRATION_GUIDE.md](./BUILDER_IO_INTEGRATION_GUIDE.md)
- [ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md](./ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md)

---

## ✅ Setup Checklist

- [ ] Created `admin-workbench-header` model
- [ ] Created `admin-workbench-metrics` model
- [ ] Created `admin-workbench-sidebar` model
- [ ] Created `admin-workbench-footer` model
- [ ] Created entries (`main`) for each model
- [ ] Published all model entries
- [ ] Set environment variables (`NEXT_PUBLIC_BUILDER_API_KEY`, `NEXT_PUBLIC_BUILDER_SPACE`)
- [ ] Restarted dev server
- [ ] Tested API endpoint with curl
- [ ] Verified content loads in dashboard
- [ ] Tested fallback when Builder.io disabled
- [ ] Checked browser DevTools Network tab
- [ ] Verified dark mode compatibility
- [ ] Tested responsive design

---

**Next Steps:**
1. Create models following above instructions
2. Add sample content to each model
3. Test loading in dashboard
4. Iterate and refine content
5. Train content team on Builder.io editor

