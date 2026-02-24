import * as React from "react"
import { adminService } from "@/services/api"
import { Save, RefreshCw, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CardSkeletonLoader } from "@/components/ui/skeleton-loader"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

export function Settings() {
  const [settings, setSettings] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [editedSettings, setEditedSettings] = React.useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  const { confirm, dialog } = useConfirmDialog()

  React.useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await adminService.getSettings()
      setSettings(data.settings)
    } catch (error: any) {
      console.error("Failed to fetch settings:", error)
      toast.error(error.response?.data?.detail || "Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string, dataType: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }))

    // Validate
    const error = validateSetting(value, dataType)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[key] = error
      } else {
        delete newErrors[key]
      }
      return newErrors
    })
  }

  const validateSetting = (value: string, dataType: string): string | null => {
    if (!value && dataType !== "boolean") {
      return "This field is required"
    }

    if (dataType === "number") {
      const num = Number(value)
      if (isNaN(num)) {
        return "Must be a valid number"
      }
      if (num < 0) {
        return "Must be a positive number"
      }
    }

    if (dataType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return "Must be a valid email address"
      }
    }

    return null
  }

  const handleResetSetting = async (setting: any) => {
    const confirmed = await confirm({
      title: "Reset Setting",
      description: `Are you sure you want to reset "${setting.setting_key}" to its default value?`
    })

    if (!confirmed) return

    try {
      // Remove from edited settings
      setEditedSettings(prev => {
        const newSettings = { ...prev }
        delete newSettings[setting.setting_key]
        return newSettings
      })

      // Clear validation error
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[setting.setting_key]
        return newErrors
      })

      toast.success("Setting reset to default")
    } catch (error: any) {
      console.error("Failed to reset setting:", error)
      toast.error("Failed to reset setting")
    }
  }

  const handleSaveAll = async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix validation errors before saving")
      return
    }

    setSaving(true)
    try {
      const updates = Object.entries(editedSettings).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value
      }))

      if (updates.length === 0) {
        toast.info("No changes to save")
        return
      }

      await adminService.bulkUpdateSettings(updates)
      toast.success(`Saved ${updates.length} setting${updates.length > 1 ? 's' : ''}`)
      setEditedSettings({})
      fetchSettings()
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      toast.error(error.response?.data?.detail || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const getSettingValue = (setting: any) => {
    return editedSettings[setting.setting_key] ?? setting.setting_value ?? ""
  }

  const renderSettingInput = (setting: any) => {
    const value = getSettingValue(setting)
    const error = validationErrors[setting.setting_key]

    if (setting.data_type === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => handleSettingChange(setting.setting_key, checked.toString(), setting.data_type)}
          />
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {setting.data_type === "text" ? (
          <Textarea
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value, setting.data_type)}
            rows={3}
            className={error ? "border-red-500" : ""}
          />
        ) : (
          <Input
            type={setting.data_type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value, setting.data_type)}
            className={error ? "border-red-500" : ""}
          />
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  const renderCategorySettings = (category: string, title: string, description: string) => {
    const categorySettings = settings.filter(s => s.category === category)

    if (categorySettings.length === 0) {
      return <p className="text-muted-foreground">No settings available</p>
    }

    return (
      <div className="space-y-4">
        {categorySettings.map((setting) => (
          <div key={setting.id} className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor={setting.setting_key}>
                    {setting.setting_key.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Label>
                  {editedSettings[setting.setting_key] !== undefined && (
                    <span className="text-xs text-orange-500">(Modified)</span>
                  )}
                </div>
                {setting.description && (
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {setting.data_type === "boolean" && renderSettingInput(setting)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetSetting(setting)}
                  disabled={editedSettings[setting.setting_key] === undefined}
                  title="Reset to default"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {setting.data_type !== "boolean" && renderSettingInput(setting)}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {dialog}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-muted-foreground">Manage application configuration and preferences</p>
          </div>
        </div>
        <div className="space-y-4">
          <CardSkeletonLoader />
          <CardSkeletonLoader />
          <CardSkeletonLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {dialog}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage application configuration and preferences</p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={saving || Object.keys(editedSettings).length === 0 || Object.keys(validationErrors).length > 0}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : `Save Changes${Object.keys(editedSettings).length > 0 ? ` (${Object.keys(editedSettings).length})` : ""}`}
        </Button>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-red-500">
              Please fix {Object.keys(validationErrors).length} validation error{Object.keys(validationErrors).length > 1 ? 's' : ''} before saving
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="business">Business Rules</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic application information and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCategorySettings("general", "General Settings", "Basic application configuration")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable system features</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCategorySettings("features", "Feature Toggles", "Control which features are enabled")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCategorySettings("notifications", "Notifications", "Manage notification preferences")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Rules</CardTitle>
              <CardDescription>Configure business logic and constraints</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCategorySettings("business", "Business Rules", "Set business rules and limits")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize email content and subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCategorySettings("email", "Email Templates", "Configure email templates")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
