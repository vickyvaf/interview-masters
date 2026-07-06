import { useState, useEffect } from 'react'
import { Container, Heading, Text, Flex, Grid, Card, Button, Separator, Box, TextArea, Slider, Badge, Skeleton, TextField } from '@radix-ui/themes'
import { useNavigate } from 'react-router-dom'
import { PlayIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function Interview() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [preConfidence, setPreConfidence] = useState([3]) // Default score 3

  // Fetch default target role and job description from user settings
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .select('target_role, job_description')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

  // Sync state once profile is loaded
  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.target_role || '')
      setJobDescription(userProfile.job_description || '')
    }
  }, [userProfile])

  const handleStart = () => {
    if (!role.trim() || !jobDescription.trim()) return

    // Navigate to practice page, passing the setup parameters as state
    navigate('/practice', {
      state: {
        role: role.trim(),
        jobDescription,
        responseMode: 'voice',
        preConfidence: preConfidence[0]
      }
    })
  }

  const isFormValid = role.trim() !== '' && jobDescription.trim() !== ''

  if (isLoading) {
    return (
      <Container size="3" style={{ padding: '40px 24px' }}>
        <Flex direction="column" gap="5">
          <Box>
            <Skeleton height="32px" width="220px" style={{ marginBottom: '8px' }} />
            <Skeleton height="16px" width="450px" />
          </Box>
          <Separator size="4" />
          <Grid columns={{ initial: '1', md: '3' }} gap="5">
            <Box style={{ gridColumn: 'span 2' }}>
              <Flex direction="column" gap="4">
                <Box>
                  <Skeleton height="18px" width="150px" style={{ marginBottom: '6px' }} />
                  <Skeleton height="36px" width="320px" />
                </Box>
                <Box>
                  <Skeleton height="18px" width="180px" style={{ marginBottom: '6px' }} />
                  <Skeleton height="120px" width="100%" />
                </Box>
              </Flex>
            </Box>
          </Grid>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Heading size="6" mb="1">Mulai Interview Baru</Heading>
          <Text size="2" color="gray">
            Konfigurasikan detail pekerjaan Anda untuk memulai simulasi wawancara kerja adaptif berbasis AI.
          </Text>
        </Box>

        <Separator size="4" />

        <Grid columns={{ initial: '1', md: '3' }} gap="5">
          {/* Form Area */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Flex direction="column" gap="4">
              {/* Target Role */}
              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Target Jabatan / Posisi <Text color="red">*</Text></Text>
                <Box maxWidth="320px">
                  <TextField.Root 
                    placeholder="e.g. Software Engineer, Product Manager" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </Box>
              </Flex>

              {/* Job Description */}
              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Deskripsi Pekerjaan (Job Description) <Text color="red">*</Text></Text>
                <Text size="1" color="gray">AI akan merancang pertanyaan yang relevan dengan kualifikasi pada deskripsi ini.</Text>
                <TextArea
                  placeholder="Tempel syarat pekerjaan, tanggung jawab, atau uraian tugas di sini..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </Flex>

              {/* Pre-Confidence rating slider */}
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Tingkat Kepercayaan Diri Awal</Text>
                <Text size="1" color="gray">Seberapa yakin Anda menghadapi simulasi wawancara ini?</Text>
                <Flex align="center" gap="4" style={{ marginTop: '8px' }}>
                  <Box style={{ flexGrow: 1 }}>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={preConfidence}
                      onValueChange={setPreConfidence}
                    />
                  </Box>
                  <Badge size="2">
                    Skor: {preConfidence[0]} / 5
                  </Badge>
                </Flex>
                <Flex justify="between" style={{ marginTop: '-4px' }}>
                  <Text size="1" color="gray">Sangat Gugup (1)</Text>
                  <Text size="1" color="gray">Sangat Yakin (5)</Text>
                </Flex>
              </Flex>

              {/* Action */}
              <Button size="3" onClick={handleStart} disabled={!isFormValid} style={{ marginTop: '16px' }}>
                <PlayIcon /> Mulai Simulasi
              </Button>
            </Flex>
          </Box>

          {/* Sidebar / Instructions Info Card */}
          <Box>
            <Card style={{ background: 'var(--accent-2)', border: '1px solid var(--accent-3)' }}>
              <Flex direction="column" gap="3">
                <Heading size="3">Petunjuk Simulasi</Heading>
                <Separator size="4" />
                <Flex direction="column" gap="2">
                  <Flex gap="2">
                    <InfoCircledIcon style={{ marginTop: '3px', flexShrink: 0 }} />
                    <Text size="2">Pertanyaan akan dibuat secara dinamis satu per satu oleh AI berdasarkan pilihan peran Anda.</Text>
                  </Flex>
                  <Flex gap="2">
                    <InfoCircledIcon style={{ marginTop: '3px', flexShrink: 0 }} />
                    <Text size="2">Gunakan mikrofon Anda untuk melatih intonasi dan kelancaran berbicara secara riil.</Text>
                  </Flex>
                  <Flex gap="2">
                    <InfoCircledIcon style={{ marginTop: '3px', flexShrink: 0 }} />
                    <Text size="2">Setelah selesai, Anda akan menerima evaluasi instan mencakup struktur STAR dan tingkat brevity.</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          </Box>
        </Grid>
      </Flex>
    </Container>
  )
}
