import type { IntercomMessage222 } from '../../../types';
import CallMessage from './CallMessage';
import TextMessage from './TextMessage';

interface Props {
  readonly messages: IntercomMessage222[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div className="toast-container">
      {messages.map((msg) => {
        if (msg.message_type === 'call') return <CallMessage key={msg.id} msg={msg} />;
        if (msg.message_type === 'text') return <TextMessage key={msg.id} msg={msg} />;
        return null;
      })}
    </div>
  );
}
