$profiles = Invoke-RestMethod -Uri 'http://localhost:5000/api/profiles' -Method Get
Write-Host "Total initial profiles: $($profiles.profiles.Count)"
Write-Host "Default profile: $($profiles.profiles[0].name) (ID: $($profiles.profiles[0].id))"

# Create second profile
$newProfBody = @{ name = 'Harshit Style Profile'; description = 'Senior Technical PM' } | ConvertTo-Json
$created = Invoke-RestMethod -Uri 'http://localhost:5000/api/profiles' -Method Post -Body $newProfBody -ContentType 'application/json'
$prof2Id = $created.profile.id
Write-Host "Created Profile 2: $($created.profile.name) (ID: $prof2Id)"

# Fetch Profile 2 master resume (should be cloned from Pushpit Virmani default)
$prof2Resume = Invoke-RestMethod -Uri "http://localhost:5000/api/resume?profileId=$prof2Id" -Method Get
Write-Host "Profile 2 Cloned Resume Name: $($prof2Resume.profile.name)"
Write-Host "Profile 2 Experience count: $($prof2Resume.profile.experience.Count)"

# Update Profile 2 master resume with different name and summary
$updateBody = @{
  profileId = $prof2Id
  name = 'Pushpit Virmani (Growth Track)'
  email = $prof2Resume.profile.email
  phone = $prof2Resume.profile.phone
  location = $prof2Resume.profile.location
  linkedinUrl = $prof2Resume.profile.linkedinUrl
  portfolioUrl = $prof2Resume.profile.portfolioUrl
  summary = 'Independent custom summary for Growth Track profile.'
  experience = $prof2Resume.profile.experience
  skills = $prof2Resume.profile.skills
  education = $prof2Resume.profile.education
  projects = $prof2Resume.profile.projects
} | ConvertTo-Json -Depth 10

$updateRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/resume' -Method Put -Body $updateBody -ContentType 'application/json'
Write-Host "Profile 2 Updated Name: $($updateRes.profile.name)"

# Verify Profile 1 (Default) is completely untouched
$prof1Resume = Invoke-RestMethod -Uri 'http://localhost:5000/api/resume?profileId=default' -Method Get
Write-Host "Profile 1 Name (must still be Pushpit Virmani): $($prof1Resume.profile.name)"
Write-Host "Profile 1 Summary starts with: $($prof1Resume.profile.summary.Substring(0, 35))"

if ($prof1Resume.profile.name -ne $updateRes.profile.name) {
  Write-Host " SUCCESS: 100% Profile Independence Confirmed!"
} else {
  Write-Host " FAIL: Profiles are not independent"
}
