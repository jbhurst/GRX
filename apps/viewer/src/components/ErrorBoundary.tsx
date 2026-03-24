import { Button, Center, Code, Stack, Text, Title } from "@mantine/core"
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Center w="100%" h="100vh">
          <Stack align="center" gap="md" maw={600}>
            <Title order={2}>Something went wrong</Title>
            <Text c="dimmed">The application encountered an unexpected error.</Text>
            {this.state.error && (
              <Code block>{this.state.error.message}</Code>
            )}
            <Button onClick={() => window.location.reload()}>
              Reload Application
            </Button>
          </Stack>
        </Center>
      )
    }
    return this.props.children
  }
}
