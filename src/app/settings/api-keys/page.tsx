'use client'

import { useState, useEffect } from 'react'

interface APIKey {
  key: string
  name: string
  createdAt: string
  expiresAt?: string
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/auth/api-keys')
      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return

    try {
      const response = await fetch('/api/auth/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: expiresInDays || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedKey(data.apiKey)
        setNewKeyName('')
        setExpiresInDays('')
        fetchKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const handleRevokeKey = async (apiKey: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return

    try {
      const response = await fetch('/api/auth/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        fetchKeys()
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-gray-600 mt-2">
              Manage API keys for MCP server authentication
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No API keys found.</p>
            <p className="text-gray-500 text-sm mt-2">
              Create an API key to authenticate with the MCP server.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key.key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {key.key.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.expiresAt
                        ? new Date(key.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRevokeKey(key.key)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create API Key</h2>

            {generatedKey ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Your API key has been generated. Copy it now - you won&apos;t
                  be able to see it again.
                </p>
                <div className="bg-gray-100 p-4 rounded mb-4 break-all font-mono text-sm">
                  {generatedKey}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey)
                    alert('Copied to clipboard!')
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    setGeneratedKey(null)
                    setShowCreateModal(false)
                  }}
                  className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires in (days, optional)
                  </label>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) =>
                      setExpiresInDays(
                        e.target.value ? parseInt(e.target.value) : '',
                      )
                    }
                    placeholder="Never expires"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Create Key
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewKeyName('')
                      setExpiresInDays('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
