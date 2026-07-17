// يبني ملف iOS Shortcut (.shortcut plist) جاهزًا للاستيراد، بالرابط والتوكن مدفونين.
// الأفعال: يأخذ مدخل الاختصار (نص الرسالة) → POST للـEdge Function → يعرض message كإشعار.
// يبقى على المستخدم إنشاء «أتمتة الرسالة» فقط (Apple تمنع توزيعها) — وهي ~4 نقرات.

const ORC = "￼" // object-replacement char: موضع المتغيّر داخل نص

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function buildShortcutPlist(endpoint: string, token: string): string {
  const uuidURL = crypto.randomUUID().toUpperCase()
  const uuidDict = crypto.randomUUID().toUpperCase()

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>WFWorkflowMinimumClientVersion</key><integer>900</integer>
  <key>WFWorkflowMinimumClientVersionString</key><string>900</string>
  <key>WFWorkflowClientVersion</key><string>1146.14</string>
  <key>WFWorkflowIcon</key>
  <dict>
    <key>WFWorkflowIconStartColor</key><integer>463140863</integer>
    <key>WFWorkflowIconGlyphNumber</key><integer>61440</integer>
  </dict>
  <key>WFWorkflowImportQuestions</key><array/>
  <key>WFWorkflowTypes</key><array/>
  <key>WFWorkflowInputContentItemClasses</key>
  <array>
    <string>WFStringContentItem</string>
    <string>WFRichTextContentItem</string>
    <string>WFURLContentItem</string>
    <string>WFGenericFileContentItem</string>
  </array>
  <key>WFWorkflowActions</key>
  <array>
    <dict>
      <key>WFWorkflowActionIdentifier</key><string>is.workflow.actions.downloadurl</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key><string>${uuidURL}</string>
        <key>WFURL</key><string>${esc(endpoint)}</string>
        <key>WFHTTPMethod</key><string>POST</string>
        <key>ShowHeaders</key><true/>
        <key>WFHTTPHeaders</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>WFDictionaryFieldValueItems</key>
            <array>
              <dict>
                <key>WFItemType</key><integer>0</integer>
                <key>WFKey</key><dict><key>Value</key><dict><key>string</key><string>Authorization</string><key>attachmentsByRange</key><dict/></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
                <key>WFValue</key><dict><key>Value</key><dict><key>string</key><string>Bearer ${esc(token)}</string><key>attachmentsByRange</key><dict/></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
              </dict>
            </array>
          </dict>
          <key>WFSerializationType</key><string>WFDictionaryFieldValue</string>
        </dict>
        <key>WFHTTPBodyType</key><string>JSON</string>
        <key>WFJSONValues</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>WFDictionaryFieldValueItems</key>
            <array>
              <dict>
                <key>WFItemType</key><integer>0</integer>
                <key>WFKey</key><dict><key>Value</key><dict><key>string</key><string>rawText</string><key>attachmentsByRange</key><dict/></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
                <key>WFValue</key><dict><key>Value</key><dict><key>string</key><string>${ORC}</string><key>attachmentsByRange</key><dict><key>{0, 1}</key><dict><key>Type</key><string>ExtensionInput</string></dict></dict></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
              </dict>
              <dict>
                <key>WFItemType</key><integer>0</integer>
                <key>WFKey</key><dict><key>Value</key><dict><key>string</key><string>source</string><key>attachmentsByRange</key><dict/></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
                <key>WFValue</key><dict><key>Value</key><dict><key>string</key><string>ios_shortcut</string><key>attachmentsByRange</key><dict/></dict><key>WFSerializationType</key><string>WFTextTokenString</string></dict>
              </dict>
            </array>
          </dict>
          <key>WFSerializationType</key><string>WFDictionaryFieldValue</string>
        </dict>
      </dict>
    </dict>
    <dict>
      <key>WFWorkflowActionIdentifier</key><string>is.workflow.actions.getvalueforkey</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key><string>${uuidDict}</string>
        <key>WFInput</key>
        <dict>
          <key>Value</key><dict><key>Type</key><string>ActionOutput</string><key>OutputUUID</key><string>${uuidURL}</string><key>OutputName</key><string>Contents of URL</string></dict>
          <key>WFSerializationType</key><string>WFTextTokenAttachment</string>
        </dict>
        <key>WFGetDictionaryValueType</key><string>Value</string>
        <key>WFDictionaryKey</key><string>message</string>
      </dict>
    </dict>
    <dict>
      <key>WFWorkflowActionIdentifier</key><string>is.workflow.actions.notification</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>WFNotificationActionTitle</key><string>صافي</string>
        <key>WFNotificationActionBody</key>
        <dict>
          <key>Value</key><dict><key>string</key><string>${ORC}</string><key>attachmentsByRange</key><dict><key>{0, 1}</key><dict><key>Type</key><string>ActionOutput</string><key>OutputUUID</key><string>${uuidDict}</string><key>OutputName</key><string>Dictionary Value</string></dict></dict></dict>
          <key>WFSerializationType</key><string>WFTextTokenString</string>
        </dict>
      </dict>
    </dict>
  </array>
</dict>
</plist>`
}
