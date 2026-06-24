export const metadata = {
  title: "RAG Book Chat",
  description: "Ask questions about your PDF books",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
