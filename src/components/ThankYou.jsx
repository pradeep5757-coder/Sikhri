import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Button, Title } from '@mantine/core';
import { SHARE } from '../config/constants';
import { focusAndReveal } from '../lib/focus';
import { shareMode } from '../lib/region';
import { CheckIcon, ShareIcon } from './Icons';

export function ThankYou({ d, status = 'succeeded', firstName }) {
  const heading = useRef(null);
  useEffect(() => focusAndReveal(heading.current), []);
  const first = (firstName ?? d.firstName).trim();

  return (
    <div className="sd-thanks">
      <span className="sd-thanks-icon" aria-hidden="true">
        <CheckIcon />
      </span>
      <Title order={2} ref={heading} tabIndex={-1}>
        Thank you{first ? `, ${first}` : ''}
      </Title>
      {status === 'processing' ? (
        <>
          <p>Your bank payment is being processed.</p>
          <p>You'll receive a receipt by email once it clears.</p>
        </>
      ) : (
        <>
          <p>Your payment was processed successfully.</p>
          <p>You'll receive a receipt by email shortly.</p>
        </>
      )}
      <ShareBlock />
    </div>
  );
}

function ShareBlock() {
  const [mode, setMode] = useState(shareMode);
  const [note, setNote] = useState('');
  const timer = useRef();
  const enc = encodeURIComponent;
  const text = `${SHARE.line} ${SHARE.url}`;

  const links = [
    { id: 'facebook', label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(SHARE.url)}` },
    { id: 'whatsapp', label: 'Share on WhatsApp', href: `https://wa.me/?text=${enc(text)}` },
    { id: 'x', label: 'Share on X', href: `https://twitter.com/intent/tweet?text=${enc(SHARE.line)}&url=${enc(SHARE.url)}` },
    { id: 'linkedin', label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SHARE.url)}` },
    { id: 'email', label: 'Share by email', href: `mailto:?subject=${enc(SHARE.subject)}&body=${enc(text)}` },
  ];

  const flash = (msg) => {
    setNote(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(''), 2200);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE.url);
      flash('Link copied');
    } catch {
      flash(SHARE.url);
    }
  };
  const nativeShare = async () => {
    try {
      await navigator.share({ title: SHARE.title, text: SHARE.line, url: SHARE.url });
    } catch (err) {
      if (err?.name !== 'AbortError') setMode('row');
    }
  };

  return (
    <div className="sd-share">
      <p className="sd-share-title">Share with your community</p>
      <p className="sd-share-sub">Invite friends and family to support Sikh education.</p>
      {mode === 'menu' ? (
        <>
          <Button className="sd-share-pill" onClick={nativeShare} leftSection={<ShareIcon name="share" />}>
            Share
          </Button>
          <button type="button" className="sd-link sd-share-copy" onClick={copy}>
            Copy link
          </button>
        </>
      ) : (
        <div className="sd-share-row">
          {links.map((l) => (
            <ActionIcon
              key={l.id}
              component="a"
              className="sd-share-ic"
              href={l.href}
              target={l.id === 'email' ? undefined : '_blank'}
              rel="noopener"
              aria-label={l.label}
              title={l.label}
            >
              <ShareIcon name={l.id} />
            </ActionIcon>
          ))}
          <ActionIcon className="sd-share-ic" onClick={copy} aria-label="Copy link" title="Copy link">
            <ShareIcon name="link" />
          </ActionIcon>
        </div>
      )}
      <p className="sd-share-note" role="status">
        {note}
      </p>
    </div>
  );
}
