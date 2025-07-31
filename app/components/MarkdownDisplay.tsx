'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

export default function MarkdownDisplay({ content, className = '' }: MarkdownDisplayProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown 
        components={{
          h1: ({node, ...props}) => <h1 className="text-samuel-off-white text-2xl font-bold mb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-samuel-off-white text-xl font-bold mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-samuel-off-white text-lg font-bold mb-1" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-samuel-off-white text-base font-bold mb-1" {...props} />,
          p: ({node, ...props}) => <p className="text-samuel-off-white mb-2" {...props} />,
          ul: ({node, ...props}) => <ul className="text-samuel-off-white list-disc pl-4 mb-2" {...props} />,
          ol: ({node, ...props}) => <ol className="text-samuel-off-white list-decimal pl-4 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="text-samuel-off-white mb-1" {...props} />,
          strong: ({node, ...props}) => <strong className="text-samuel-bright-red font-bold" {...props} />,
          em: ({node, ...props}) => <em className="text-samuel-off-white/90 italic" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-samuel-bright-red pl-4 text-samuel-off-white/80 italic mb-2" {...props} />
          ),
          code: ({node, inline, ...props}) => 
            inline 
              ? <code className="bg-samuel-dark-teal/20 text-samuel-off-white px-1 py-0.5 rounded text-sm" {...props} />
              : <code className="bg-samuel-dark-teal/20 text-samuel-off-white p-2 rounded block text-sm" {...props} />,
          hr: ({node, ...props}) => <hr className="border-samuel-off-white/20 my-4" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}