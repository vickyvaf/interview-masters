import { useState, useEffect } from 'react'
import { Container, Heading, Text, Flex, Card, Button, Separator, Box, Grid, TextField, TextArea, Select, Switch, Skeleton, IconButton } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { PersonIcon, MixerHorizontalIcon, GearIcon, Link2Icon, Cross2Icon } from '@radix-ui/react-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import * as Toast from '@radix-ui/react-toast'

export default function Settings() {
  const queryClient = useQueryClient()

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Profile fields state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('job_seeker')
  const [tier, setTier] = useState('free')

  // Interview preference state
  const [targetRole, setTargetRole] = useState('')
  const [interviewLanguage, setInterviewLanguage] = useState('id')
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState('')

  // Settings / Feature state
  const [cameraOn, setCameraOn] = useState(true)

  // React Query: Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Self-heal: insert user row if not found
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          }
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single()

          if (insertError) throw insertError
          return { ...inserted, authEmail: user.email, authFullName: user.user_metadata?.full_name || user.user_metadata?.name }
        }
        throw error
      }
      return { ...data, authEmail: user.email, authFullName: user.user_metadata?.full_name || user.user_metadata?.name }
    }
  })

  // Sync loaded user profile data with component state
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || userProfile.authFullName || '')
      setEmail(userProfile.email || userProfile.authEmail || '')
      setRole(userProfile.role || 'job_seeker')
      setTier(userProfile.tier || 'free')
      setTargetRole(userProfile.target_role || '')
      setInterviewLanguage(userProfile.interview_language || 'id')
      setJobDescription(userProfile.job_description || '')
      setResume(userProfile.resume || '')
      setCameraOn(userProfile.camera_on ?? true)
    }
  }, [userProfile])

  // React Query: Mutation for saving user settings
  const saveMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('users')
        .update(updatedFields)
        .eq('id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      setToastType('success')
      setToastMessage('Pengaturan berhasil disimpan!')
      setToastOpen(true)
    },
    onError: (err: any) => {
      console.error('Error updating settings:', err.message)
      setToastType('error')
      setToastMessage('Gagal menyimpan: ' + err.message)
      setToastOpen(true)
    }
  })

  const handleSave = () => {
    saveMutation.mutate({
      full_name: fullName,
      role,
      target_role: targetRole,
      interview_language: interviewLanguage,
      job_description: jobDescription,
      resume,
      camera_on: cameraOn,
      updated_at: new Date().toISOString()
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <Container size="3" style={{ padding: '40px 24px' }}>
        <Flex direction="column" gap="5">
          {/* Header Skeleton */}
          <Box>
            <Skeleton height="32px" width="150px" style={{ marginBottom: '8px' }} />
            <Skeleton height="16px" width="320px" />
          </Box>

          <Separator size="4" />

          {/* Section 1: Profil Skeleton */}
          <Box>
            <Skeleton height="24px" width="120px" style={{ marginBottom: '12px' }} />
            <Card size="3">
              <Flex direction="column" gap="4">
                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                  <Flex direction="column" gap="1">
                    <Skeleton height="16px" width="80px" style={{ marginBottom: '4px' }} />
                    <Skeleton height="36px" width="100%" />
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Skeleton height="16px" width="80px" style={{ marginBottom: '4px' }} />
                    <Skeleton height="36px" width="100%" />
                  </Flex>
                </Grid>
                <Flex direction="column" gap="1">
                  <Skeleton height="16px" width="150px" style={{ marginBottom: '4px' }} />
                  <Skeleton height="36px" width="240px" />
                </Flex>
              </Flex>
            </Card>
          </Box>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Heading size="6" mb="1">Pengaturan</Heading>
          <Text size="2" color="gray">
            Sesuaikan profil, preferensi simulasi wawancara AI, dan konfigurasi akun Anda.
          </Text>
        </Box>

        <Separator size="4" />

        {/* Section 1: Profil Pengguna */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <PersonIcon /> Profil Pengguna
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="4">
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Nama Lengkap</Text>
                  <TextField.Root 
                    placeholder="Masukkan nama lengkap Anda" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Alamat Email</Text>
                  <TextField.Root 
                    placeholder="Masukkan email Anda" 
                    value={email}
                    disabled
                    type="email" 
                  />
                </Flex>
              </Grid>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Peran / Pekerjaan Saat Ini</Text>
                <Box maxWidth="240px">
                  <Select.Root value={role} onValueChange={setRole}>
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="student">Mahasiswa / Fresh Graduate</Select.Item>
                      <Select.Item value="job_seeker">Pencari Kerja Aktif</Select.Item>
                      <Select.Item value="professional">Profesional Berpengalaman</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 2: Preferensi Wawancara */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <GearIcon /> Preferensi Wawancara AI
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="4">
              <Grid columns={{ initial: '1', md: '2' }} gap="4">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Target Jabatan / Posisi Kerja</Text>
                  <TextField.Root 
                    placeholder="e.g. Software Engineer, Marketing Lead" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">Bahasa Wawancara Utama</Text>
                  <Box>
                    <Select.Root value={interviewLanguage} onValueChange={setInterviewLanguage}>
                      <Select.Trigger style={{ width: '100%' }} />
                      <Select.Content>
                        <Select.Item value="id">Bahasa Indonesia (ID)</Select.Item>
                        <Select.Item value="en">English (EN)</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>
                </Flex>
              </Grid>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Deskripsi Pekerjaan Default (Job Description)</Text>
                <TextArea 
                  placeholder="Tempel deskripsi pekerjaan target Anda di sini agar AI menyesuaikan pertanyaannya secara otomatis..." 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5} 
                />
              </Flex>

              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Resume / Ringkasan Pengalaman</Text>
                <TextArea 
                  placeholder="Tempel ringkasan CV / Resume Anda di sini..." 
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  rows={5} 
                />
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 3: Konfigurasi Perangkat */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <MixerHorizontalIcon /> Fitur & Perangkat
            </Flex>
          </Heading>
          <Card size="3">
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Box>
                  <Text size="2" weight="bold">Aktifkan Kamera Saat Mulai</Text>
                  <Text size="1" color="gray" as="div">Membuka umpan balik kamera secara otomatis ketika sesi dimulai.</Text>
                </Box>
                <Switch checked={cameraOn} onCheckedChange={setCameraOn} />
              </Flex>
            </Flex>
          </Card>
        </Box>

        {/* Section 4: Informasi Langganan */}
        <Box>
          <Heading size="4" mb="3">
            <Flex align="center" gap="2">
              <Link2Icon /> Langganan & Akun
            </Flex>
          </Heading>
          <Card size="3" style={{ background: 'var(--gray-2)' }}>
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Box>
                <Text size="2" weight="bold">Tipe Langganan Anda: {tier.toUpperCase()} Tier</Text>
                <Text size="1" color="gray" as="div">
                  {tier === 'free' 
                    ? 'Upgrade ke Pro untuk simulasi tanpa batas dan analisis mendalam dari AI.' 
                    : 'Terima kasih telah menggunakan paket premium kami.'}
                </Text>
              </Box>
              <Button asChild variant="outline">
                <Link to="/billing">Kelola Billing</Link>
              </Button>
            </Flex>
          </Card>
        </Box>

        {/* Action Buttons */}
        <Flex direction={{ initial: 'column-reverse', sm: 'row' }} gap="3" justify="between" style={{ marginTop: '16px' }}>
          <style>{`
            @media (max-width: 600px) {
              .action-button-mobile {
                width: 100% !important;
              }
            }
          `}</style>
          <Box>
            <Button
              variant="outline"
              color="red"
              onClick={handleLogout}
              className="action-button-mobile"
            >
              Keluar / Logout
            </Button>
          </Box>
          <Flex gap="3" direction={{ initial: 'column-reverse', sm: 'row' }} className="action-button-mobile">
            <Button 
              variant="soft" 
              color="gray" 
              disabled={saveMutation.isPending}
              className="action-button-mobile"
            >
              Batal
            </Button>
            <Button 
              variant="solid" 
              onClick={handleSave} 
              loading={saveMutation.isPending}
              className="action-button-mobile"
            >
              Simpan Perubahan
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Toast.Provider swipeDirection="right">
        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          style={{
            background: toastType === 'success' ? 'var(--green-3)' : 'var(--red-3)',
            border: `1px solid ${toastType === 'success' ? 'var(--green-6)' : 'var(--red-6)'}`,
            borderRadius: '8px',
            boxShadow: 'var(--shadow-4)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: '12px',
            position: 'relative',
          }}
        >
          <Flex direction="column" gap="1" style={{ flexGrow: 1 }}>
            <Toast.Title style={{ fontWeight: 'bold', fontSize: '14px', color: toastType === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
              {toastType === 'success' ? 'Sukses' : 'Gagal'}
            </Toast.Title>
            <Toast.Description style={{ fontSize: '13px', color: toastType === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
              {toastMessage}
            </Toast.Description>
          </Flex>
          <Toast.Close asChild>
            <IconButton
              size="1"
              variant="ghost"
              color={toastType === 'success' ? 'green' : 'red'}
              style={{ cursor: 'pointer', borderRadius: '50%', marginTop: '-2px' }}
            >
              <Cross2Icon width="14" height="14" />
            </IconButton>
          </Toast.Close>
        </Toast.Root>

        <Toast.Viewport
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '320px',
            maxWidth: '100vw',
            margin: 0,
            listStyle: 'none',
            zIndex: 9999,
            outline: 'none',
          }}
        />
      </Toast.Provider>
    </Container>
  )
}
