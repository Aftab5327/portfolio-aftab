import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('Missing GROQ_API_KEY')
    return res.status(500).json({ 
      error: 'Server is missing GROQ_API_KEY.' 
    })
  }

  const { message } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: `You are Aftab Dhalait portfolio AI assistant.
              Answer recruiter questions about Aftab only.
              Be concise under 100 words. Use bullet points.
              
              Name: Aftab Dhalait
              Role: Full Stack Developer, IoT Engineer, AI Builder
              Location: Pune, India
              Email: aftab.iot@gmail.com
              Phone: +91 9370312566
              Experience: 2+ years, 10+ projects
              Open to: Full Stack, IoT, AI roles
              Education: B.E. Electronics & Telecommunication 
              with Data Science Honors + CDAC Advanced Computing
              
              Skills: React, Next.js, JavaScript, TypeScript,
              Node.js, Express, Python, MongoDB, MySQL,
              Arduino, ESP32, MQTT, TensorFlow, OpenCV,
              Docker, Git, Vercel
              
              Projects: Smart Cap for Visually Impaired,
              InfraSense 360, LLM Monitoring System,
              Weather Monitoring IoT, E-Commerce MERN,
              FastBox Optimizer, Smart Bookmark App,
              Product Catalog`
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      }
    )

    console.log('Groq status:', response.status)
    const data = await response.json()
    console.log('Groq response:', JSON.stringify(data))

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Groq API call failed' 
      })
    }

    const reply = data.choices[0].message.content
    return res.status(200).json({ reply })

  } catch (error: any) {
    console.error('Groq catch error:', error.message)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}
