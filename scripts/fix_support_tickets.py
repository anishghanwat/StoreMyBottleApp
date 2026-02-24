"""Fix SupportTickets component"""

# Read the file
with open('admin/src/components/SupportTickets.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the handleDelete function
old_delete = '''  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return

    try {
      await adminService.deleteTicket(id)
      toast.success("Ticket deleted successfully")
      fetchTickets()'''

new_delete = '''  const handleDelete = async (id: string) => {
    confirm({
      title: "Delete Ticket",
      description: "Are you sure you want to delete this ticket? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminService.deleteTicket(id)
          toast.success("Ticket deleted successfully")
          fetchTickets(true)
          if (isDetailOpen) setIsDetailOpen(false)
        } catch (error: any) {
          console.error("Failed to delete ticket:", error)
          toast.error(error.response?.data?.detail || "Failed to delete ticket")
        }
      }
    })
  }

  // Placeholder to prevent duplicate'''

# Only replace the first occurrence
if old_delete in content:
    content = content.replace(old_delete, new_delete, 1)
    print("✓ Updated handleDelete function")
else:
    print("✗ handleDelete pattern not found")

# Add dialog at the end before closing
if '{dialog}' not in content:
    # Find the last closing of the component
    last_div = content.rfind('</div>\n  )\n}')
    if last_div != -1:
        content = content[:last_div] + '</div>\n\n      {dialog}\n    </div>\n  )\n}'
        print("✓ Added dialog at end")
    else:
        print("✗ Could not find end of component")
else:
    print("✓ Dialog already added")

# Write back
with open('admin/src/components/SupportTickets.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ SupportTickets.tsx updated successfully!")
