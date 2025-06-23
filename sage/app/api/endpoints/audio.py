from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.audio_service import transcribe_chunk
from app.core.model import generate_from_model
import asyncio
import json

router = APIRouter()

@router.websocket("/ws/transcribe")
async def websocket_transcribe(ws: WebSocket):
    await ws.accept()
    transcript_parts = []
    audio_chunks = []  # Store audio chunks to process at the end
    
    try:
        while True:
            # Receive audio chunk
            chunk = await ws.receive_bytes()
            
            # Store chunk for later processing
            if len(chunk) > 100:  # Only store meaningful chunks
                audio_chunks.append(chunk)
                
                # Send acknowledgment to client
                await ws.send_text(json.dumps({
                    "type": "chunk_received", 
                    "chunk_count": len(audio_chunks)
                }))

    except WebSocketDisconnect:
        print("Client disconnected, processing audio...")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await ws.send_text(json.dumps({"type": "error", "message": str(e)}))

    finally:
        # Check if WebSocket is still open before processing
        if ws.client_state.name != "DISCONNECTED":
            try:
                # Process all collected audio chunks
                if audio_chunks:
                    await ws.send_text(json.dumps({"type": "processing", "message": "Processing audio..."}))
                    
                    # Combine all chunks into one audio blob
                    combined_audio = b''.join(audio_chunks)
                    
                    try:
                        # Transcribe the combined audio
                        final_transcript = await transcribe_chunk(combined_audio)
                        
                        if final_transcript.strip():
                            print(f"Final transcript: {final_transcript}")
                            
                            # Send transcript to client
                            await ws.send_text(json.dumps({
                                "type": "final_transcript", 
                                "text": final_transcript
                            }))
                            
                            # Generate LLM response
                            await ws.send_text(json.dumps({"type": "generating", "message": "Generating response..."}))
                            
                            llm_answer = generate_from_model(final_transcript)
                            await ws.send_text(json.dumps({
                                "type": "llm_response", 
                                "text": llm_answer,
                                "final_transcript": final_transcript
                            }))
                        else:
                            await ws.send_text(json.dumps({"type": "error", "message": "No speech detected"}))
                            
                    except Exception as e:
                        print(f"Processing error: {e}")
                        await ws.send_text(json.dumps({"type": "error", "message": f"Processing error: {str(e)}"}))
                else:
                    await ws.send_text(json.dumps({"type": "error", "message": "No audio data received"}))
                    
            except Exception as e:
                print(f"Error in finally block: {e}")
        else:
            # WebSocket already closed, just process without sending updates
            if audio_chunks:
                print("WebSocket closed, processing audio silently...")
                combined_audio = b''.join(audio_chunks)
                try:
                    final_transcript = await transcribe_chunk(combined_audio)
                    if final_transcript.strip():
                        print(f"Final transcript (silent): {final_transcript}")
                        llm_answer = generate_from_model(final_transcript)
                        print(f"LLM response (silent): {llm_answer}")
                except Exception as e:
                    print(f"Silent processing error: {e}")
        
        # Safe close
        try:
            if ws.client_state.name != "DISCONNECTED":
                await ws.close()
        except:
            pass