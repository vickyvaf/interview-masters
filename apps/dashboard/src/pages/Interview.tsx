import { useState } from 'react'
import { Container, Heading, Text, Flex, Grid, Card, Button, Separator, Box, TextArea, Slider, Badge, Select } from '@radix-ui/themes'
import { useNavigate } from 'react-router-dom'
import { PlayIcon, InfoCircledIcon } from '@radix-ui/react-icons'

export default function Interview() {
  const navigate = useNavigate()
  const [role, setRole] = useState('software_engineer')
  const [jobDescription, setJobDescription] = useState('')
  const [responseMode, setResponseMode] = useState('voice')
  const [preConfidence, setPreConfidence] = useState([3]) // Default score 3

  const handleStart = () => {
    // Navigate to practice page, passing the setup parameters as state
    navigate('/practice', {
      state: {
        role,
        jobDescription,
        responseMode,
        preConfidence: preConfidence[0]
      }
    })
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
                <Text size="2" weight="bold">Target Jabatan / Posisi</Text>
                <Box maxWidth="320px">
                  <Select.Root value={role} onValueChange={setRole}>
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="software_engineer">Software Engineer</Select.Item>
                      <Select.Item value="product_manager">Product Manager</Select.Item>
                      <Select.Item value="data_analyst">Data Analyst</Select.Item>
                      <Select.Item value="marketing_associate">Marketing Associate</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>

              {/* Job Description */}
              <Flex direction="column" gap="1">
                <Text size="2" weight="bold">Deskripsi Pekerjaan (Job Description)</Text>
                <Text size="1" color="gray">AI akan merancang pertanyaan yang relevan dengan kualifikasi pada deskripsi ini.</Text>
                <TextArea
                  placeholder="Tempel syarat pekerjaan, tanggung jawab, atau uraian tugas di sini..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </Flex>

              {/* Response Mode selection */}
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Mode Respons Wawancara</Text>
                <Flex gap="4">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="responseMode"
                      value="voice"
                      checked={responseMode === 'voice'}
                      onChange={() => setResponseMode('voice')}
                    />
                    <Text size="2">Suara / Audio (Speech-to-Text)</Text>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="responseMode"
                      value="text"
                      checked={responseMode === 'text'}
                      onChange={() => setResponseMode('text')}
                    />
                    <Text size="2">Teks / Pengetikan Manual</Text>
                  </label>
                </Flex>
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
              <Button size="3" onClick={handleStart} style={{ marginTop: '16px' }}>
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
                    <Text size="2">Pilihlah <strong>Mode Suara</strong> untuk melatih intonasi dan kelancaran berbicara secara riil.</Text>
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
