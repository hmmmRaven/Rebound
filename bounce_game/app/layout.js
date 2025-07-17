import './globals.css';

export const metadata = {
  title: 'Basketball Bounce',
  description: 'Stomp the players and avoid spikes!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
