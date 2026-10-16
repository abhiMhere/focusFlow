import React, { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, Radio } from 'lucide-react'
import {
  playAmbient, stopAmbient, setAmbientVolume, isAmbientPlaying
} from '../../services/audio/audioManager'
import { useSettingsStore } from '../../store/settingsStore'

type AmbientType = 'rain' | 'cafe' | 'nature' | null

const AMBIENT_TRACKS = [
  { id: 'rain',   label: 'Rain',   icon: '🌧️', desc: 'Soft rain on a rooftop' },
  { id: 'cafe',   label: 'Café',   icon: '☕', desc: 'Quiet café ambience' },
  { id: 'nature', label: 'Nature', icon: '🌿', desc: 'Forest birds and breeze' },
]

export function MusicPage() {
  const { settings, updateSettings } = useSettingsStore()
  const [playing, setPlaying] = useState<AmbientType>(null)
  const [volume, setVolume] = useState(settings.musicVolume)
  const [muted, setMuted] = useState(false)

  const effectiveVolume = muted ? 0 : volume

  useEffect(() => {
    setAmbientVolume(effectiveVolume)
  }, [effectiveVolume])

  useEffect(() => {
    return () => { stopAmbient() }
  }, [])

  const handlePlay = (type: 'rain' | 'cafe' | 'nature') => {
    if (playing === type) {
      stopAmbient()
      setPlaying(null)
    } else {
      playAmbient(type, effectiveVolume)
      setPlaying(type)
    }
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    updateSettings({ musicVolume: v })
    if (playing) setAmbientVolume(muted ? 0 : v)
  }

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    setAmbientVolume(newMuted ? 0 : volume)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="flex items-center gap-3 mb-2">
        <Music size={22} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Ambient Music</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Generated ambient sounds using Web Audio API. Playback starts only on tap/click.
      </p>

      {/* Volume */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => handleVolumeChange(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Volume"
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 36 }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {AMBIENT_TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => handlePlay(track.id as 'rain' | 'cafe' | 'nature')}
            style={{
              background: playing === track.id ? 'var(--accent)' : 'var(--bg-card)',
              border: `1px solid ${playing === track.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: playing === track.id ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            }}
            aria-pressed={playing === track.id}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{track.icon}</div>
            <div style={{
              fontSize: 16, fontWeight: 600,
              color: playing === track.id ? 'white' : 'var(--text-primary)',
              marginBottom: 4
            }}>
              {track.label}
            </div>
            <div style={{
              fontSize: 12,
              color: playing === track.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
            }}>
              {track.desc}
            </div>
            <div style={{ marginTop: 12 }}>
              {playing === track.id
                ? <Pause size={18} color="white" />
                : <Play size={18} color="var(--accent)" />
              }
            </div>
          </button>
        ))}
      </div>

      {playing && (
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 10,
          background: 'var(--accent)', color: 'white', fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Radio size={16} />
          <span>Now playing: <strong>{AMBIENT_TRACKS.find(t => t.id === playing)?.label}</strong> ambience</span>
          <button onClick={() => { stopAmbient(); setPlaying(null) }}
            className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
            Stop
          </button>
        </div>
      )}

      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: 10, fontSize: 12,
        color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)'
      }}>
        ℹ️ All sounds are synthesized locally using the Web Audio API. No music files are downloaded.
        Playback stops when you leave this page or close the tab.
      </div>
    </div>
  )
}
