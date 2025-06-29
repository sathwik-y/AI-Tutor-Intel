# app/api/endpoints/audio.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.audio_service import transcribe_chunk
from app.core.model import generate_from_model
import asyncio
import json

router = APIRouter()

@router.websocket("/ws/transcribe")
async def websocket_transcribe(ws: WebSocket):
    await ws.accept()
    audio_chunks = []
    processing_complete = False
    
    try:
        while True:
            try:
                # Set a timeout for receiving data
                chunk = await asyncio.wait_for(ws.receive_bytes(), timeout=1.0)
                
                # Store chunk for processing
                if len(chunk) > 100:
                    audio_chunks.append(chunk)
                    
                    # Send acknowledgment to client
                    await ws.send_text(json.dumps({
                        "type": "chunk_received", 
                        "chunk_count": len(audio_chunks)
                    }))
                    
            except asyncio.TimeoutError:
                # No data received for 1 second - check if we should process
                if audio_chunks and not processing_complete:
                    # Process audio while connection is still open
                    await process_audio_and_respond(ws, audio_chunks)
                    processing_complete = True
                continue
                
    except WebSocketDisconnect:
        print("Client disconnected")
        if not processing_complete and audio_chunks:
            print("Processing audio after disconnect...")
            # Still try to process for debugging
            combined_audio = b''.join(audio_chunks)
            try:
                final_transcript = await transcribe_chunk(combined_audio)
                if final_transcript.strip():
                    print(f"Final transcript (silent): {final_transcript}")
                    llm_answer = generate_from_model(final_transcript)
                    print(f"LLM response (silent): {llm_answer[:100]}...")
            except Exception as e:
                print(f"Silent processing error: {e}")
    
    except Exception as e:
        print(f"WebSocket error: {e}")

    finally:
        try:
            await ws.close()
        except:
            pass

async def process_audio_and_respond(ws: WebSocket, audio_chunks: list):
    """Process audio and send response while WebSocket is open"""
    try:
        # Send processing status
        await ws.send_text(json.dumps({"type": "processing", "message": "Processing audio..."}))
        
        # Combine and transcribe audio
        combined_audio = b''.join(audio_chunks)
        final_transcript = await transcribe_chunk(combined_audio)
        
        if final_transcript.strip():
            print(f"Final transcript: {final_transcript}")
            
            # Send transcript
            await ws.send_text(json.dumps({
                "type": "final_transcript", 
                "text": final_transcript
            }))
            
            # Send generating status
            await ws.send_text(json.dumps({"type": "generating", "message": "Generating response..."}))
            
            # Generate LLM response
            llm_answer = generate_from_model(final_transcript)
            print(f"Generated response, sending to client...")
            
            # Send LLM response (this triggers TTS on client)
            await ws.send_text(json.dumps({
                "type": "llm_response", 
                "text": llm_answer,
                "final_transcript": final_transcript
            }))
            
            print("✅ Response sent to client - TTS should trigger")
            
            # Keep connection open briefly for TTS to process
            await asyncio.sleep(3)
            
        else:
            await ws.send_text(json.dumps({"type": "error", "message": "No speech detected"}))
            
    except Exception as e:
        print(f"Processing error: {e}")
        await ws.send_text(json.dumps({"type": "error", "message": f"Processing error: {str(e)}"}))