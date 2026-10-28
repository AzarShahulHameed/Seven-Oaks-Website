import { PageEnter } from '@/components/motion';

// A template (unlike a layout) is re-created on every navigation, which is what lets each page animate in.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
