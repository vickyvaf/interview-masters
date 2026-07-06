import { useState } from 'react'
import { Container, Heading, Text, Flex, Grid, Card, Button, Badge, Table, Box, Separator, Skeleton } from '@radix-ui/themes'
import { ArrowLeftIcon, ClockIcon, CheckCircledIcon, CrossCircledIcon, StarIcon } from '@radix-ui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function History() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Query 1: Fetch list of all mock interview sessions
  const { data: sessions, isLoading: loadingList } = useQuery({
    queryKey: ['sessionsList'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Query 2: Fetch detailed questions and AI feedback for selected session
  const { data: sessionDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['sessionDetail', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null

      // Get interview metadata
      const { data: interview, error: interviewError } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('id', selectedSessionId)
        .single()

      if (interviewError) throw interviewError

      // Get questions with answers and feedback
      const { data: questions, error: questionsError } = await supabase
        .from('interview_questions')
        .select(`
          id,
          question_text,
          sequence_number,
          interview_answers (
            id,
            answer_text,
            response_mode,
            voice_duration_seconds,
            ai_feedbacks (
              structure_score,
              relevance_score,
              brevity_score,
              overall_score,
              feedback_text,
              highlights_rambling,
              what_you_could_have_said
            )
          )
        `)
        .eq('mock_interview_id', selectedSessionId)
        .order('sequence_number', { ascending: true })

      if (questionsError) throw questionsError

      return {
        ...interview,
        questions: questions || []
      }
    },
    enabled: selectedSessionId !== null
  })

  const formatRoleLabel = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'amber'
    return 'red'
  }

  if (loadingList) {
    return (
      <Container size="3" style={{ padding: '40px 24px' }}>
        <Flex direction="column" gap="5">
          {/* Header Skeleton */}
          <Box>
            <Skeleton height="32px" width="200px" style={{ marginBottom: '8px' }} />
            <Skeleton height="16px" width="450px" />
          </Box>

          <Separator size="4" />

          {/* Table Rows Skeleton */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Target Peran</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Tanggal</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Kepercayaan Diri</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Skor Rata-rata AI</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {[1, 2, 3].map((i) => (
                  <Table.Row key={i}>
                    <Table.RowHeaderCell><Skeleton height="18px" width="120px" /></Table.RowHeaderCell>
                    <Table.Cell><Skeleton height="16px" width="80px" /></Table.Cell>
                    <Table.Cell><Skeleton height="20px" width="60px" /></Table.Cell>
                    <Table.Cell><Skeleton height="16px" width="50px" /></Table.Cell>
                    <Table.Cell><Skeleton height="18px" width="40px" /></Table.Cell>
                    <Table.Cell style={{ textAlign: 'right' }}><Skeleton height="28px" width="90px" /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        {!selectedSessionId ? (
          <Box>
            <Heading size="6" mb="1">Riwayat & Evaluasi</Heading>
            <Text size="2" color="gray">
              Tinjau riwayat latihan wawancara Anda dan baca umpan balik mendalam dari AI.
            </Text>
          </Box>
        ) : (
          <Flex align="center" gap="3">
            <Button variant="ghost" onClick={() => setSelectedSessionId(null)}>
              <ArrowLeftIcon width="18" height="18" /> Kembali
            </Button>
            {sessionDetail && (
              <Box>
                <Heading size="5">{formatRoleLabel(sessionDetail.target_role)}</Heading>
                <Text size="1" color="gray">{formatDate(sessionDetail.created_at)}</Text>
              </Box>
            )}
          </Flex>
        )}

        <Separator size="4" />

        {/* Conditional Rendering: List View vs Detail View */}
        {!selectedSessionId ? (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Target Peran</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Tanggal</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Kepercayaan Diri</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Skor Rata-rata AI</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {sessions && sessions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                      <Text size="2" color="gray">Belum ada riwayat simulasi wawancara.</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  sessions?.map((session) => (
                    <Table.Row key={session.id}>
                      <Table.RowHeaderCell>{formatRoleLabel(session.target_role)}</Table.RowHeaderCell>
                      <Table.Cell>{formatDate(session.created_at)}</Table.Cell>
                      <Table.Cell>
                        {session.status === 'completed' ? (
                          <Badge color="green" variant="soft">
                            <CheckCircledIcon style={{ marginRight: '4px' }} /> Selesai
                          </Badge>
                        ) : (
                          <Badge color="red" variant="soft">
                            <CrossCircledIcon style={{ marginRight: '4px' }} /> Ditinggalkan
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {session.pre_confidence_score} → {session.post_confidence_score || '--'} / 5
                      </Table.Cell>
                      <Table.Cell>
                        {session.overall_score !== null ? (
                          <strong>{session.overall_score} / 100</strong>
                        ) : (
                          <Text color="gray">--</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <Button
                          size="1"
                          variant="soft"
                          disabled={session.status !== 'completed'}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          Detail Feedback
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Card>
        ) : loadingDetail ? (
          <Flex direction="column" gap="5">
            {/* Session Stats Banner Skeleton */}
            <Card style={{ background: 'var(--gray-2)' }}>
              <Grid columns={{ initial: '1', md: '3' }} gap="4">
                <Box>
                  <Skeleton height="12px" width="100px" style={{ marginBottom: '8px' }} />
                  <Skeleton height="28px" width="120px" />
                </Box>
                <Box>
                  <Skeleton height="12px" width="120px" style={{ marginBottom: '8px' }} />
                  <Skeleton height="20px" width="180px" />
                </Box>
                <Box>
                  <Skeleton height="12px" width="90px" style={{ marginBottom: '8px' }} />
                  <Skeleton height="20px" width="150px" />
                </Box>
              </Grid>
            </Card>

            {/* Questions & AI Feedbacks Skeleton */}
            <Skeleton height="24px" width="200px" style={{ marginBottom: '12px' }} />
            <Flex direction="column" gap="4">
              {[1, 2].map((i) => (
                <Card key={i} size="2">
                  <Flex direction="column" gap="3">
                    <Box mb="1">
                      <Skeleton height="18px" width="80px" style={{ marginBottom: '6px' }} />
                      <Skeleton height="24px" width="100%" />
                    </Box>
                    <Separator size="4" />
                    <Box>
                      <Skeleton height="16px" width="90px" style={{ marginBottom: '8px' }} />
                      <Skeleton height="36px" width="100%" />
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>
        ) : sessionDetail ? (
          <Flex direction="column" gap="5">
            {/* Session Stats Banner */}
            <Card style={{ background: 'var(--gray-2)' }}>
              <Grid columns={{ initial: '1', md: '3' }} gap="4">
                <Box>
                  <Text size="1" color="gray" weight="bold">Skor Rata-rata AI</Text>
                  <Heading size="5">{sessionDetail.overall_score} / 100</Heading>
                </Box>
                <Box>
                  <Text size="1" color="gray" weight="bold">Metrik Kepercayaan Diri</Text>
                  <Text size="2" as="div" style={{ marginTop: '4px' }}>
                    Sebelum: <strong>{sessionDetail.pre_confidence_score}/5</strong> • Sesudah: <strong>{sessionDetail.post_confidence_score || '--'}/5</strong>
                  </Text>
                </Box>
                <Box>
                  <Text size="1" color="gray" weight="bold">Total Pertanyaan</Text>
                  <Text size="2" as="div" style={{ marginTop: '4px' }}>
                    <strong>{sessionDetail.questions.length} Pertanyaan Selesai</strong>
                  </Text>
                </Box>
              </Grid>
            </Card>

            {/* Questions & AI Feedbacks */}
            <Heading size="4">Daftar Tanya Jawab & Evaluasi</Heading>
            <Flex direction="column" gap="4">
              {sessionDetail.questions.map((q: any, idx: number) => {
                const answer = q.interview_answers?.[0]
                const feedback = answer?.ai_feedbacks?.[0]

                return (
                  <Card key={q.id} size="2">
                    <Flex direction="column" gap="3">
                      {/* Question Header */}
                      <Box>
                        <Badge color="blue" mb="1">Pertanyaan {idx + 1}</Badge>
                        <Heading size="3">{q.question_text}</Heading>
                      </Box>

                      <Separator size="4" />

                      {/* User Answer */}
                      <Box>
                        <Text size="2" weight="bold" color="gray" as="div" mb="1">Jawaban Anda:</Text>
                        <Card variant="surface" style={{ background: 'var(--gray-1)' }}>
                          <Text size="2" style={{ fontStyle: 'italic' }}>
                            {answer ? `"${answer.answer_text}"` : <Text color="red">Tidak ada jawaban perekaman.</Text>}
                          </Text>
                        </Card>
                        {answer?.voice_duration_seconds && (
                          <Text size="1" color="gray" style={{ marginTop: '6px', display: 'block' }}>
                            <ClockIcon style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Durasi Rekaman: {answer.voice_duration_seconds} detik
                          </Text>
                        )}
                      </Box>

                      {feedback && (
                        <>
                          <Separator size="4" />
                          {/* AI Feedback */}
                          <Box>
                            <Text size="2" weight="bold" as="div" mb="2">
                              <StarIcon style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Evaluasi AI (Skor: {feedback.overall_score}/100)
                            </Text>

                            <Grid columns={{ initial: '1', md: '3' }} gap="2" mb="3">
                              <Card size="1">
                                <Text size="1" color="gray" as="div">Struktur (STAR)</Text>
                                <Text size="2" weight="bold" color={getScoreColor(feedback.structure_score)}>{feedback.structure_score}%</Text>
                              </Card>
                              <Card size="1">
                                <Text size="1" color="gray" as="div">Relevansi</Text>
                                <Text size="2" weight="bold" color={getScoreColor(feedback.relevance_score)}>{feedback.relevance_score}%</Text>
                              </Card>
                              <Card size="1">
                                <Text size="1" color="gray" as="div">Kepadatan (Brevity)</Text>
                                <Text size="2" weight="bold" color={getScoreColor(feedback.brevity_score)}>{feedback.brevity_score}%</Text>
                              </Card>
                            </Grid>

                            <Flex direction="column" gap="2">
                              <Box>
                                <Text size="2" weight="bold">Ulasan AI:</Text>
                                <Text size="2" color="gray" as="div">{feedback.feedback_text}</Text>
                              </Box>

                              {feedback.highlights_rambling && (
                                <Box style={{ background: 'var(--red-2)', padding: '10px', borderRadius: '6px' }}>
                                  <Text size="2" weight="bold" color="red">Bagian Bertele-tele yang Disorot:</Text>
                                  <Text size="2" color="red" style={{ textDecoration: 'line-through' }} as="div">
                                    "{feedback.highlights_rambling}"
                                  </Text>
                                </Box>
                              )}

                              {feedback.what_you_could_have_said && (
                                <Box style={{ background: 'var(--green-2)', padding: '10px', borderRadius: '6px' }}>
                                  <Text size="2" weight="bold" color="green">Saran Jawaban Lebih Baik (What You Could Have Said):</Text>
                                  <Text size="2" color="green" as="div" style={{ fontWeight: '500' }}>
                                    "{feedback.what_you_could_have_said}"
                                  </Text>
                                </Box>
                              )}
                            </Flex>
                          </Box>
                        </>
                      )}
                    </Flex>
                  </Card>
                )
              })}
            </Flex>
          </Flex>
        ) : (
          <Flex justify="center" align="center" style={{ minHeight: '30vh' }}>
            <Text size="2" color="red">Gagal memuat detail evaluasi.</Text>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
