TITLE: Handle Run Inference Button Click (Python)
DESCRIPTION: Defines the callback function executed when the 'Run Inference' button is clicked. It manages file uploads, determines video dimensions using OpenCV, synchronizes audio and video durations by padding or trimming, performs a hypothetical `perform_inference` operation, converts the output video's FPS, displays the final video, and cleans up temporary files. It also ensures GPU memory is cleared.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LatentSync.ipynb#_snippet_25

LANGUAGE: Python
CODE:
```
def on_run_button_click(change):
    with output_display:
        output_display.clear_output()

        print("Checking Video...")
        if not video_upload.value or not audio_upload.value:
            print("Please upload both video and audio files.")
            return


        video_file_info = next(iter(video_upload.value.values()))
        video_path = "uploaded_video.mp4"
        with open(video_path, "wb") as f:
            f.write(video_file_info['content'])

        global width, height
        if width <= 0 or height <= 0:
            print("Setting output video's width & height.")
            import cv2
            cap = cv2.VideoCapture(video_path)
            if cap.isOpened():
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            else:
                print("Error: Unable to open video file.")
            cap.release()

        # print("Uploading Audio...")
        audio_file_info = next(iter(audio_upload.value.values()))
        audio_path = "uploaded_audio.mp3"
        with open(audio_path, "wb") as f:
            f.write(audio_file_info['content'])

        video_path = convert_video_fps(video_path, 25)

        audio_path, num_frames, audio_duration = pad_audio_to_multiple_of_16(audio_path, target_fps=25)


        video_duration = get_video_duration (video_path)

        if audio_duration > video_duration:
            video_path = extend_video(video_path, audio_duration)
            video_duration = get_video_duration (video_path)
            if video_duration > audio_duration:
                video_path = trim_video(video_path, audio_duration)

        elif video_duration > audio_duration:
            video_path = trim_video(video_path, audio_duration)

        try:
            print("Running inference...")
            output_path = "output_video.mp4"
            perform_inference(video_path, audio_path, seed_input.value, num_steps_input.value, guidance_scale_input.value, output_path)

            output_path = convert_video_fps(output_path, output_fps_input.value)

            print("Inference complete. Displaying output video:")
            from IPython.display import Video
            if width <= 0 :
                display(Video(output_path, embed=True))
            else:
                display(Video(output_path, embed=True, width=int(width * video_scale_input.value), height=int(height * video_scale_input.value)))

            # print("Download output video")
            # files.download(output_path)

        finally:
            torch.cuda.empty_cache()
            for file in [video_path, audio_path]:
                if os.path.exists(file):
                    os.remove(file)
```

----------------------------------------

TITLE: Generate Video from Prompts using ComfyUI Workflow
DESCRIPTION: The `generate_video` function orchestrates a complete video generation process using a ComfyUI-like workflow. It takes positive and negative prompts, dimensions, and sampling parameters as input. The function loads CLIP and VAE models, encodes prompts, generates an empty latent video, performs K-sampling, decodes latents, and includes memory management steps to optimize resource usage during the generation process.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_14B_T2V_GGUF_Free.ipynb#_snippet_7

LANGUAGE: python
CODE:
```
def generate_video(
    positive_prompt: str = "a fox moving quickly in a beautiful winter scenery nature trees mountains daytime tracking camera",
    negative_prompt: str = "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走",
    width: int = 832,
    height: int = 480,
    seed: int = 82628696717253,
    steps: int = 30,
    cfg_scale: float = 1.0,
    sampler_name: str = "uni_pc",
    scheduler: str = "simple",
    frames: int = 33,
    fps: int = 16,
    output_format: str = "mp4"
):

    with torch.inference_mode():
        print("Loading Text_Encoder...")
        clip = clip_loader.load_clip("umt5_xxl_fp8_e4m3fn_scaled.safetensors", "wan", "default")[0]

        positive = clip_encode_positive.encode(clip, positive_prompt)[0]
        negative = clip_encode_negative.encode(clip, negative_prompt)[0]

        del clip
        torch.cuda.empty_cache()
        gc.collect()

        empty_latent = empty_latent_video.generate(width, height, frames, 1)[0]

        print("Loading Unet Model...")
        if useQ6:
            model = unet_loader.load_unet("wan2.1-t2v-14b-Q6_K.gguf")[0]
        else:
            model = unet_loader.load_unet("wan2.1-t2v-14b-Q5_0.gguf")[0]
        # model = model_sampling.patch(model, 8)[0]

        print("Generating video...")
        sampled = ksampler.sample(
            model=model,
            seed=seed,
            steps=steps,
            cfg=cfg_scale,
            sampler_name=sampler_name,
            scheduler=scheduler,
            positive=positive,
            negative=negative,
            latent_image=empty_latent
        )[0]

        del model
        torch.cuda.empty_cache()
        gc.collect()

        print("Loading VAE...")
        vae = vae_loader.load_vae("wan_2.1_vae.safetensors")[0]

        try:
            print("Decoding latents...")
            decoded = vae_decode.decode(vae, sampled)[0]

            del vae
            torch.cuda.empty_cache()
            gc.collect()

            output_path = ""
            if frames == 1:
```

----------------------------------------

TITLE: Prepare Environment and Download Models for WAN Image to Video
DESCRIPTION: This Python script prepares the Google Colab environment for running the WAN Image to Video model. It installs essential libraries like PyTorch, torchvision, diffusers, accelerate, xformers, and av. It then clones the ComfyUI repository and its ComfyUI_GGUF custom node, installing their respective dependencies. Finally, it downloads the necessary GGUF models (Q4 or Q6 based on a boolean flag), text encoders, VAE, and CLIP vision models using aria2c, and sets up Python paths for ComfyUI modules.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_14B_I2V_GGUF_Free.ipynb#_snippet_0

LANGUAGE: python
CODE:
```
# @title Prepare Environment
!pip install torch==2.6.0 torchvision==0.21.0
%cd /content

!pip install -q torchsde einops diffusers accelerate xformers==0.0.29.post2
!pip install av
!git clone https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI/custom_nodes
!git clone https://github.com/Isi-dev/ComfyUI_GGUF.git
%cd /content/ComfyUI/custom_nodes/ComfyUI_GGUF
!pip install -r requirements.txt
%cd /content/ComfyUI
!apt -y install -qq aria2 ffmpeg

useQ6 = False # @param {"type":"boolean"}

if useQ6:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/city96/Wan2.1-I2V-14B-480P-gguf/resolve/main/wan2.1-i2v-14b-480p-Q6_K.gguf -d /content/ComfyUI/models/unet -o wan2.1-i2v-14b-480p-Q6_K.gguf
else:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/city96/Wan2.1-I2V-14B-480P-gguf/resolve/main/wan2.1-i2v-14b-480p-Q4_0.gguf -d /content/ComfyUI/models/unet -o wan2.1-i2v-14b-480p-Q4_0.gguf

!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors -d /content/ComfyUI/models/text_encoders -o umt5_xxl_fp8_e4m3fn_scaled.safetensors
!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors -d /content/ComfyUI/models/vae -o wan2.1_vae.safetensors
!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors -d /content/ComfyUI/models/clip_vision -o clip_vision_h.safetensors

import torch
import numpy as np
from PIL import Image
import gc
import sys
import random
import os
import imageio
import subprocess
from google.colab import files
from IPython.display import display, HTML, Image as IPImage
sys.path.insert(0, '/content/ComfyUI')

from comfy import model_management

from nodes import (
    CheckpointLoaderSimple,
    CLIPLoader,
    CLIPTextEncode,
    VAEDecode,
    VAELoader,
    KSampler,
    UNETLoader,
    LoadImage,
    CLIPVisionLoader,
    CLIPVisionEncode
)

from custom_nodes.ComfyUI_GGUF.nodes import UnetLoaderGGUF
from comfy_extras.nodes_model_advanced import ModelSamplingSD3
from comfy_extras.nodes_images import SaveAnimatedWEBP
from comfy_extras.nodes_video import SaveWEBM
from comfy_extras.nodes_wan import WanImageToVideo
```

----------------------------------------

TITLE: Prepare Environment and Download Wan2.1-14b GGUF Models
DESCRIPTION: This Python script prepares the Google Colab environment by installing required libraries (torch, diffusers, accelerate, xformers, av), cloning the ComfyUI and ComfyUI_GGUF repositories, and installing their dependencies. It then downloads either the Q5 or Q6 quantized Wan2.1-14b GGUF model, along with necessary text encoders and VAE safetensors, based on a boolean flag. Finally, it sets up the Python path and imports relevant ComfyUI nodes for model loading and generation.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_14B_T2V_GGUF_Free.ipynb#_snippet_0

LANGUAGE: python
CODE:
```
# @title Prepare Environment
!pip install torch==2.6.0 torchvision==0.21.0
%cd /content

!pip install -q torchsde einops diffusers accelerate xformers==0.0.29.post2
!pip install av
!git clone https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI/custom_nodes
!git clone https://github.com/Isi-dev/ComfyUI_GGUF.git
%cd /content/ComfyUI/custom_nodes/ComfyUI_GGUF
!pip install -r requirements.txt
%cd /content/ComfyUI
!apt -y install -qq aria2 ffmpeg

useQ6 = False # @param {"type":"boolean"}

if useQ6:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/city96/Wan2.1-T2V-14B-gguf/resolve/main/wan2.1-t2v-14b-Q6_K.gguf -d /content/ComfyUI/models/unet -o wan2.1-t2v-14b-Q6_K.gguf
else:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/city96/Wan2.1-T2V-14B-gguf/resolve/main/wan2.1-t2v-14b-Q5_0.gguf -d /content/ComfyUI/models/unet -o wan2.1-t2v-14b-Q5_0.gguf

!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors -d /content/ComfyUI/models/text_encoders -o umt5_xxl_fp8_e4m3fn_scaled.safetensors
!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors -d /content/ComfyUI/models/vae -o wan_2.1_vae.safetensors

import torch
import numpy as np
from PIL import Image
import gc
import sys
import random
import os
import imageio
import subprocess
from google.colab import files
from IPython.display import display, HTML, Image as IPImage
sys.path.insert(0, '/content/ComfyUI')

from comfy import model_management

from nodes import (
    CheckpointLoaderSimple,
    CLIPLoader,
    CLIPTextEncode,
    VAEDecode,
    VAELoader,
    KSampler,
    UNETLoader
)

from custom_nodes.ComfyUI_GGUF.nodes import UnetLoaderGGUF
from comfy_extras.nodes_model_advanced import ModelSamplingSD3
from comfy_extras.nodes_hunyuan import EmptyHunyuanLatentVideo
from comfy_extras.nodes_images import SaveAnimatedWEBP
from comfy_extras.nodes_video import SaveWEBM

# unet_loader = UNETLoader()
unet_loader = UnetLoaderGGUF()
```

----------------------------------------

TITLE: Prepare ComfyUI Environment and Download Models in Google Colab
DESCRIPTION: This snippet sets up the necessary environment for running ComfyUI in Google Colab. It installs Python packages, clones the ComfyUI repository, installs system dependencies, and downloads pre-trained diffusion models and text encoders using aria2c.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_1_3B_T2V_Free.ipynb#_snippet_0

LANGUAGE: Shell
CODE:
```
!pip install torch==2.6.0 torchvision==0.21.0
%cd /content

!pip install -q torchsde einops diffusers accelerate xformers==0.0.29.post2
!pip install av
!git clone https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI
!apt -y install -qq aria2 ffmpeg

!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors -d /content/ComfyUI/models/diffusion_models -o wan2.1_t2v_1.3B_fp16.safetensors
!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors -d /content/ComfyUI/models/text_encoders -o umt5_xxl_fp8_e4m3fn_scaled.safetensors
!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors -d /content/ComfyUI/models/vae -o wan_2.1_vae.safetensors
```

----------------------------------------

TITLE: Python: Core Video/Image Generation Process
DESCRIPTION: This snippet details the end-to-end process of generating video or images. It includes steps for loading VAE and Unet models, encoding positive and negative prompts, performing K-sampler inference, decoding latents, and saving the output as MP4, WEBM, or PNG. It also incorporates memory management with `torch.cuda.empty_cache()` and `gc.collect()`.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_14B_I2V_GGUF_Free.ipynb#_snippet_1

LANGUAGE: python
CODE:
```
        del clip_vision
        torch.cuda.empty_cache()
        gc.collect()

        print("Loading VAE...")
        vae = vae_loader.load_vae("wan_2.1_vae.safetensors")[0]

        positive_out, negative_out, latent = wan_image_to_video.encode(
            positive, negative, vae, width, height, frames, 1, loaded_image, clip_vision_output
        )

        print("Loading Unet Model...")
        if useQ6:
            model = unet_loader.load_unet("wan2.1-i2v-14b-480p-Q6_K.gguf")[0]
        else:
            model = unet_loader.load_unet("wan2.1-i2v-14b-480p-Q4_0.gguf")[0]
        model = model_sampling.patch(model, 8)[0]

        print("Generating video...")
        sampled = ksampler.sample(
            model=model,
            seed=seed,
            steps=steps,
            cfg_scale=cfg_scale,
            sampler_name=sampler_name,
            scheduler=scheduler,
            positive=positive_out,
            negative=negative_out,
            latent_image=latent
        )[0]

        del model
        torch.cuda.empty_cache()
        gc.collect()

        try:
            print("Decoding latents...")
            decoded = vae_decode.decode(vae, sampled)[0]

            del vae
            torch.cuda.empty_cache()
            gc.collect()

            output_path = ""
            if frames == 1:
                print("Single frame detected - saving as PNG image...")
                output_path = save_as_image(decoded[0], "ComfyUI")
                # print(f"Image saved as PNG: {output_path}")

                display(IPImage(filename=output_path))
            else:
                if output_format.lower() == "webm":
                    print("Saving as WEBM...")
                    output_path = save_as_webm(
                        decoded,
                        "ComfyUI",
                        fps=fps,
                        codec="vp9",
                        quality=10
                    )
                elif output_format.lower() == "mp4":
                    print("Saving as MP4...")
                    output_path = save_as_mp4(decoded, "ComfyUI", fps)
                else:
                    raise ValueError(f"Unsupported output format: {output_format}")

                # print(f"Video saved as {output_format.upper()}: {output_path}")

                display_video(output_path)

        except Exception as e:
            print(f"Error during decoding/saving: {str(e)}")
            raise
        finally:
            clear_memory()
```

----------------------------------------

TITLE: Clear GPU and System Memory in Python
DESCRIPTION: This function clears Python's garbage collector, empties the CUDA cache, and deletes PyTorch tensors from global scope to free up memory, especially useful in environments like Google Colab to prevent out-of-memory errors during model inference. It requires `gc` and `torch`.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_VACE_&_CausVid_LoRA_4_Image+ControlVideo_to_Video (1).ipynb#_snippet_12

LANGUAGE: Python
CODE:
```
def clear_memory():
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    for obj in list(globals().values()):
        if torch.is_tensor(obj) or (hasattr(obj, "data") and torch.is_tensor(obj.data)):
            del obj
    gc.collect()
```

----------------------------------------

TITLE: Initialize and Print Random Seed for Reproducibility
DESCRIPTION: Ensures reproducible video generation by initializing a random seed. If the global `seed` variable is zero, a new random 32-bit integer is generated; otherwise, the existing `seed` value is retained. The final seed used for generation is then printed to the console for tracking.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LTXV_0_9_7_13B_Distilled_Image_to_Video.ipynb#_snippet_35

LANGUAGE: python
CODE:
```
import random
seed = seed if seed != 0 else random.randint(0, 2**32 - 1)
print(f"Using seed: {seed}")
```

----------------------------------------

TITLE: Prepare ComfyUI LTX-Video Environment
DESCRIPTION: This snippet installs necessary Python packages, clones the ComfyUI repository, and downloads pre-trained LTX-Video models (ltx-video-2b-v0.9.5.safetensors and t5xxl text encoders) required for video generation. It also sets up the working directory and installs system dependencies like aria2 and ffmpeg.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LTX_Video_with_Start_&_End_frames.ipynb#_snippet_0

LANGUAGE: Bash
CODE:
```
!pip install torch==2.6.0 torchvision==0.21.0
%cd /content
Always_Load_Models_for_Inference = False
Use_t5xxl_fp16 = False

!pip install -q torchsde einops diffusers accelerate xformers==0.0.29.post2
!pip install av
!git clone https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI
!apt -y install -qq aria2 ffmpeg

!aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Isi99999/LTX-Video/resolve/main/ltx-video-2b-v0.9.5.safetensors -d /content/ComfyUI/models/checkpoints -o ltx-video-2b-v0.9.5.safetensors
if Use_t5xxl_fp16:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Isi99999/LTX-Video/resolve/main/t5xxl_fp16.safetensors -d /content/ComfyUI/models/text_encoders -o t5xxl_fp16.safetensors
else:
    !aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/Isi99999/LTX-Video/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors -d /content/ComfyUI/models/text_encoders -o t5xxl_fp8_e4m3fn_scaled.safetensors
```

----------------------------------------

TITLE: Google Colab UI Interaction for Media Processing (Python)
DESCRIPTION: This comprehensive function serves as an event handler for a 'run' button in a Google Colab UI. It orchestrates the entire media processing workflow: validating user uploads (audio and image), saving them locally, padding the audio, creating a video from the image, performing an external 'inference' step, converting the output video's FPS, and finally displaying the result. It includes error handling for file uploads and ensures GPU memory is cleared and temporary files are removed. The associated code also shows how to set up and display the interactive widgets.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LatentSync.ipynb#_snippet_8

LANGUAGE: Python
CODE:
```
def on_run_button_click(change):
    with output_display:
        output_display.clear_output()

        # Validate uploads
        if not audio_upload.value or not image_upload.value:
            print("Please upload both an image and an audio file.")
            return

        # Process audio
        audio_file_info = next(iter(audio_upload.value.values()))
        audio_path = audio_file_info.get('name', 'uploaded_audio.wav')
        with open(audio_path, "wb") as f:
            f.write(audio_file_info['content'])

        # Get audio duration with padding
        audio_path, num_frames = pad_audio_to_multiple_of_16(audio_path, target_fps=25)

        # Process image and create video
        image_file_info = next(iter(image_upload.value.values()))
        image_path = image_file_info.get('name', 'uploaded_image.png')
        with open(image_path, "wb") as f:
            f.write(image_file_info['content'])

        img = cv2.imread(image_path)
        if img is None:
            print("Error: Could not read the image file.")
            return

        height, width, _ = img.shape
        video_path = "generated_video.mp4"
        video_path = create_video_from_image(image_path, video_path, num_frames)

        try:
            print("Running inference...")
            output_path = "output_video.mp4"
            perform_inference(video_path, audio_path, seed_input.value, num_steps_input.value, guidance_scale_input.value, output_path)

            output_path = convert_video_fps(output_path, output_fps_input.value)

            from IPython.display import Video
            print("Inference complete. Displaying output video:")
            display(Video(output_path, embed=True, width=int(width * video_scale_input.value), height=int(height * video_scale_input.value)))

        finally:
            torch.cuda.empty_cache()
            for path in [video_path, audio_path, image_path]:
                if path and os.path.exists(path):
                    os.remove(path)

run_button.on_click(on_run_button_click)

# Display the UI
widgets_box = widgets.VBox([
    image_upload, audio_upload,
    seed_input, num_steps_input, guidance_scale_input, video_scale_input,
    output_fps_input, run_button, output_display
])
display(widgets_box)
```

----------------------------------------

TITLE: Configure Image Generation Parameters (Google Colab)
DESCRIPTION: Defines input parameters for the image generation function, specifically formatted for Google Colab notebooks using `@param` annotations. It allows users to easily adjust prompts, dimensions, seed, steps, and other sampling settings, including a dynamic seed generation if set to 0.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Hidream_fp8.ipynb#_snippet_8

LANGUAGE: Python
CODE:
```
positive_prompt = "anime girl with massive fennec ears and a big fluffy fox tail with long wavy blonde hair and blue eyes wearing a pink sweater a large oversized black winter coat and a long blue maxi skirt and large winter boots and a red scarf and large gloves sitting in a sled sledding fast down a snow mountain" # @param {"type":"string"}
negative_prompt = "bad ugly jpeg artifacts " # @param {"type":"string"}
width = 1024 # @param {"type":"integer", "min":512, "max":2048}
height = 1024 # @param {"type":"integer", "min":512, "max":2048}
seed = 1000 # @param {"type":"integer"}
steps = 16 # @param {"type":"integer", "min":1, "max":100}
cfg_scale = 1.0 # @param {"type":"number", "min":0.1, "max":20.0}
sampler_name = "lcm" # @param ["lcm", "uni_pc", "euler", "dpmpp_2m", "ddim", "lms"]
scheduler = "simple" # @param ["simple", "normal", "karras", "exponential"]
shift = 3.0 # @param {"type":"number", "min":0.0, "max":10.0}

import random
seed = seed if seed != 0 else random.randint(0, 2**32 - 1)
print(f"Using seed: {seed}")
```

----------------------------------------

TITLE: Initialize Seed and Execute ComfyUI Video Generation
DESCRIPTION: This Python code block initializes a random seed if not specified and then initiates the video generation process using the `generate_video` function, likely part of a ComfyUI integration. It takes various inputs such as image/video paths, prompts, resolution, frame rates, and applies the previously defined LoRA and ControlNet settings to produce a video output.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_VACE_&_CausVid_LoRA_4_Image+ControlVideo_to_Video (1).ipynb#_snippet_32

LANGUAGE: Python
CODE:
```
%cd /content/ComfyUI

import random
seed = seed if seed != 0 else random.randint(0, 2**32 - 1)
print(f"Using seed: {seed}")

# with torch.inference_mode():
generate_video(
    image_path=file_uploaded,
    video_path=vid_uploaded,
    positive_prompt=positive_prompt,
    negative_prompt=negative_prompt,
    change_resolution=change_resolution,
    width=new_width,
    height=new_height,
    select_every_nth=select_every_nth_frame,
    skip_first_frames=skip_first_frames,
    seed=seed,
    use_causvid=use_causvid_lora,
    causvid_lora_strength=causvid_lora_strength,
    steps=steps,
    cfg_scale=cfg_scale,
    sampler_name=sampler_name,
    scheduler=scheduler,
    frames=max_frames,
    fps=fps,
    remove_first_frame=remove_first_frame,
    match_colors=match_colors,
    output_format=output_format,
    overwrite=overwrite,
    use_lora_1=use_lora_1,
    LoRA_1_Strength=LoRA_1_Strength,
    use_lora_2=use_lora_2,
    LoRA_2_Strength=LoRA_2_Strength,
    use_controlnet_canny=use_canny,
    low_threshold=canny_low_threshold,
    high_threshold=canny_high_threshold,
    resolution=canny_resolution,
    use_controlnet_depth=use_depth
)

end_time = time.time()
duration = end_time - start_time
mins, secs = divmod(duration, 60)
print(f"✅ Generation completed in {int(mins)} min {secs:.2f} sec")

clear_memory()
```

----------------------------------------

TITLE: Prepare Environment and Install Dependencies for LTXV
DESCRIPTION: This snippet sets up the Python environment within Google Colab, installs necessary Python libraries like PyTorch, torchvision, torchaudio, diffusers, accelerate, xformers, and av. It also clones the required ComfyUI and custom nodes (ComfyUI_GGUF, ComfyUI_LTXVideo) from GitHub, and installs system-level dependencies like aria2 and ffmpeg.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LTXV_0_9_7_13B_Distilled_Image_to_Video.ipynb#_snippet_0

LANGUAGE: python
CODE:
```
# @title Prepare Environment
# !pip install --upgrade --quiet torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

!pip install torch==2.6.0 torchvision==0.21.0

%cd /content
Use_t5xxl_fp16 = False

!pip install -q torchsde einops diffusers accelerate xformers==0.0.29.post2
!pip install av
!git clone --branch ComfyUI_v0.3.34 https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI/custom_nodes
!git clone --branch forHidream https://github.com/Isi-dev/ComfyUI_GGUF.git
!git clone https://github.com/Isi-dev/ComfyUI_LTXVideo
%cd /content/ComfyUI/custom_nodes/ComfyUI_GGUF
!pip install -r requirements.txt
%cd /content/ComfyUI/custom_nodes/ComfyUI_LTXVideo
!pip install -r requirements.txt
%cd /content/ComfyUI
!apt -y install -qq aria2 ffmpeg
from IPython.display import clear_output
clear_output()
```

----------------------------------------

TITLE: Prepare Environment for Video Generation
DESCRIPTION: This Python code snippet prepares the Google Colab environment for video generation using Wan2.1 VACE & CausVid LoRA. It installs specific versions of PyTorch and related libraries, clones the ComfyUI repository along with its custom nodes (ComfyUI_GGUF, comfyui_controlnet_aux), and sets up the Practical-RIFE project for frame interpolation. It also includes functions to install additional Python packages (e.g., diffusers, transformers, xformers) and system-level packages (e.g., aria2) using pip and apt-get.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_VACE_&_CausVid_LoRA_4_Image+ControlVideo_to_Video_1.ipynb#_snippet_0

LANGUAGE: python
CODE:
```
# @title Prepare Environment
!pip install torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0
%cd /content

from IPython.display import clear_output

!git clone --branch ComfyUI_v0.3.36 https://github.com/Isi-dev/ComfyUI
%cd /content/ComfyUI/custom_nodes
!git clone https://github.com/Isi-dev/ComfyUI_GGUF.git
!git clone https://github.com/Isi-dev/comfyui_controlnet_aux
clear_output()
%cd /content/ComfyUI/custom_nodes/ComfyUI_GGUF
!pip install -r requirements.txt
clear_output()
%cd /content/ComfyUI/custom_nodes/comfyui_controlnet_aux
!pip install -r requirements.txt
clear_output()

%cd /content
!git clone https://github.com/Isi-dev/Practical-RIFE
%cd /content/Practical-RIFE
!pip install git+https://github.com/rk-exxec/scikit-video.git@numpy_deprecation
!mkdir -p /content/Practical-RIFE/train_log
!wget -q https://huggingface.co/Isi99999/Frame_Interpolation_Models/resolve/main/4.25/train_log/IFNet_HDv3.py -O /content/Practical-RIFE/train_log/IFNet_HDv3.py
!wget -q https://huggingface.co/Isi99999/Frame_Interpolation_Models/resolve/main/4.25/train_log/RIFE_HDv3.py -O /content/Practical-RIFE/train_log/RIFE_HDv3.py
!wget -q https://huggingface.co/Isi99999/Frame_Interpolation_Models/resolve/main/4.25/train_log/refine.py -O /content/Practical-RIFE/train_log/refine.py
!wget -q https://huggingface.co/Isi99999/Frame_Interpolation_Models/resolve/main/4.25/train_log/flownet.pkl -O /content/Practical-RIFE/train_log/flownet.pkl
clear_output()

%cd /content/ComfyUI

import subprocess
import sys


def install_pip_packages():
    packages = [
        'torchsde',
        'av',
        'diffusers',
        'transformers',
        'xformers==0.0.29.post2',
        'accelerate',
        # 'omegaconf',
        'tqdm',
        # 'librosa',
        # 'triton',
        # 'sageattention',
        'color-matcher',
        'onnxruntime',
        'onnxruntime-gpu',
        'einops'
    ]

    for package in packages:
        try:
            # Run pip install silently (using -q)
            subprocess.run(
                [sys.executable, '-m', 'pip', 'install', '-q', package],
                check=True,
                capture_output=True
            )
            print(f"✓ {package} installed")
        except subprocess.CalledProcessError as e:
            print(f"✗ Error installing {package}: {e.stderr.decode().strip() or 'Unknown error'}")

def install_apt_packages():
    packages = ['aria2']

    try:
        # Run apt install silently (using -qq)
        subprocess.run(
            ['apt-get', '-y', 'install', '-qq'] + packages,
            check=True,
            capture_output=True
        )
        print("✓ apt packages installed")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing apt packages: {e.stderr.decode().strip() or 'Unknown error'}")
```

----------------------------------------

TITLE: Video Saving, Display, and Memory Management in Python
DESCRIPTION: This Python code snippet manages the saving of decoded video frames into either WEBM or MP4 formats based on user selection. It includes error handling, memory cleanup using `torch.cuda.empty_cache()` and `gc.collect()`, and a utility function `display_video` to render the generated video within an IPython environment. The `display_video` function encodes video data to base64 and embeds it in an HTML5 video tag for display.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/Wan2_1_VACE_&_CausVid_LoRA_4_Image+ControlVideo_to_Video_1.ipynb#_snippet_29

LANGUAGE: python
CODE:
```
                    print("Saving as WEBM...")
                    output_path = save_as_webm(
                        decoded,
                        base_name,
                        fps=fps,
                        codec="vp9",
                        quality=10
                    )
                elif output_format.lower() == "mp4":
                    print("Saving as MP4...")
                    output_path = save_as_mp4(decoded, base_name, fps)
                else:
                    raise ValueError(f"Unsupported output format: {output_format}")

                # print(f"Video saved as {output_format.upper()}: {output_path}")

                display_video(output_path)

                global vid_15fps

                vid_15fps = output_path

                del decoded
                torch.cuda.empty_cache()
                gc.collect()

        except Exception as e:
            print(f"Error during decoding/saving: {str(e)}")
            raise
        finally:
            clear_memory()

def display_video(video_path):
    from IPython.display import HTML
    from base64 import b64encode

    video_data = open(video_path,'rb').read()

    # Determine MIME type based on file extension
    if video_path.lower().endswith('.mp4'):
        mime_type = "video/mp4"
    elif video_path.lower().endswith('.webm'):
        mime_type = "video/webm"
    elif video_path.lower().endswith('.webp'):
        mime_type = "image/webp"
    else:
        mime_type = "video/mp4"  # default

    data_url = f"data:{mime_type};base64," + b64encode(video_data).decode()

    display(HTML(f"""
    <video width=512 controls autoplay loop>
        <source src="{data_url}" type="{mime_type}">
    </video>
    """))

print("✅ Environment Setup Complete!")
```

----------------------------------------

TITLE: Orchestrate Video Generation Pipeline with Diffusion Model
DESCRIPTION: This comprehensive Python code block manages the end-to-end video generation process within a Google Colab environment. It handles loading diffusion models and VAEs, preprocessing input images, performing guided diffusion passes, sampling latent videos, decoding latents into frames, and saving the final output as an MP4. It also includes a utility function to display the generated video and robust GPU memory management.
SOURCE: https://github.com/isi-dev/google-colab_notebooks/blob/main/LTX_Video_with_Start_&_End_frames.ipynb#_snippet_5

LANGUAGE: python
CODE:
```
        processed_image = preprocess.preprocess(loaded_image, 35)[0]

        loaded_guide_image = load_image.load_image(guide_image_path)[0]
        processed_guide_image = preprocess.preprocess(loaded_guide_image, 40)[0]

        print("Loading model & VAE...")
        model, _, vae = checkpoint_loader.load_checkpoint("ltx-video-2b-v0.9.5.safetensors")
        print("Loaded model & VAE!")

        # Create empty latent video
        latent_video = empty_latent.generate(width, height, length)[0]

        # First guide pass
        guided_positive, guided_negative, guided_latent_1 = add_guide.generate(
            positive=positive,
            negative=negative,
            vae=vae,
            latent=latent_video,
            image=processed_image,
            frame_idx=0,
            strength=1
        )

        # Second guide pass (from the other image)
        guided_positive, guided_negative, guided_latent = add_guide.generate(
            positive=guided_positive,
            negative=guided_negative,
            vae=vae,
            latent=guided_latent_1,
            image=processed_guide_image,
            frame_idx=guide_frame,
            strength=guide_strength
        )

        # Get sigmas for sampling
        sigmas = scheduler.get_sigmas(steps, cfg_scale, 0.95, True, 0.1, guided_latent_1)[0]
        selected_sampler = sampler_select.get_sampler(sampler_name)[0]

        # Apply conditioning
        conditioned_positive, conditioned_negative = conditioning.append(
            guided_positive,
            guided_negative,
            25.0
        )

        print("Generating video...")

        # Sample the video
        sampled = sampler.sample(
            model=model,
            add_noise=True,
            noise_seed=seed if seed != 0 else random.randint(0, 2**32),
            cfg=cfg_scale,
            positive=conditioned_positive,
            negative=conditioned_negative,
            sampler=selected_sampler,
            sigmas=sigmas,
            latent_image=guided_latent
        )[0]

        # Crop guides if needed
        cropped_latent = crop_guides.crop(
            conditioned_positive,
            conditioned_negative,
            sampled
        )[2]

        del model
        torch.cuda.empty_cache()
        gc.collect()
        print("Model removed from memory")

        with torch.no_grad():
            try:
                print("Decoding Latents...")
                decoded = vae_decode.decode(vae, cropped_latent)[0].detach()
                print("Latents Decoded!")
                del vae
                torch.cuda.empty_cache()
                gc.collect()
                print("VAE removed from memory")
            except Exception as e:
                print(f"Error during decoding: {str(e)}")
                raise

        # Save as MP4
        output_path = "/content/output.mp4"
        frames_np = (decoded.cpu().numpy() * 255).astype(np.uint8)
        with imageio.get_writer(output_path, fps=fps) as writer:
            for frame in frames_np:
                writer.append_data(frame)

        print(f"\nVideo generation complete!")
        print(f"Saved {len(decoded)} frames to {output_path}")
        display_video(output_path)

    except Exception as e:
        print(f"Error during video generation: {str(e)}")
        raise
    finally:
        clear_gpu_memory()

def display_video(video_path):
    """Display video in Colab notebook with proper HTML5 player"""
    from IPython.display import HTML
    from base64 import b64encode

    mp4 = open(video_path,'rb').read()
    data_url = "data:video/mp4;base64," + b64encode(mp4).decode()

    display(HTML(f"""
    <video width=512 controls autoplay loop>
        <source src="{data_url}" type="video/mp4">
    </video>
    """))
```
