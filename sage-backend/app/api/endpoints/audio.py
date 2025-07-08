# app/api/endpoints/audio.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.audio_service import transcribe_chunk
from app.core.model import generate_from_model
from app.services.analytics_service import record_query
import asyncio
import json

router = APIRouter()
last_response = {"transcript": "", "response": "", "ready": False}
@router.websocket("/ws/transcribe")
async def websocket_transcribe(ws: WebSocket):
    await ws.accept()
    audio_chunks = []
    
    try:
        while True:
            # Receive audio chunk (no timeout)
            chunk = await ws.receive_bytes()
            
            # Store chunk for processing
            if len(chunk) > 100:
                audio_chunks.append(chunk)
                
                # Send acknowledgment to client
                await ws.send_text(json.dumps({
                    "type": "chunk_received", 
                    "chunk_count": len(audio_chunks)
                }))

    except WebSocketDisconnect:
        print("Client disconnected, processing audio...")
        # Process audio after disconnect
        if audio_chunks:
            try:
                combined_audio = b''.join(audio_chunks)
                final_transcript = await transcribe_chunk(combined_audio)
                
                if final_transcript.strip():
                    record_query("voice")
                    print(f"Final transcript: {final_transcript}")
                    llm_answer = generate_from_model(final_transcript)
                    print(f"LLM response: {llm_answer[:100]}...")
                    
                    # Store for client polling (from your other version)
                    last_response["transcript"] = final_transcript
                    last_response["response"] = llm_answer
                    last_response["ready"] = True
                    
                else:
                    print("No speech detected")
                    
            except Exception as e:
                print(f"Processing error: {e}")
    
    except Exception as e:
        print(f"WebSocket error: {e}")

@router.get("/get-last-response")
async def get_last_response():
    """Get the last transcription response"""
    if last_response["ready"]:
        result = last_response.copy()
        last_response["ready"] = False
        return result
    else:
        return {"ready": False}
    

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
            
            print("Response sent to client - TTS should trigger")
            
            # Keep connection open briefly for TTS to process
            await asyncio.sleep(3)
            
        else:
            await ws.send_text(json.dumps({"type": "error", "message": "No speech detected"}))
            
    except Exception as e:
        print(f"Processing error: {e}")
        await ws.send_text(json.dumps({"type": "error", "message": f"Processing error: {str(e)}"}))