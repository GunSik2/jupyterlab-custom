FROM cgshome2/secure-notebook

ARG cuda_ver=11.3
RUN /bin/bash -c "conda install pytorch torchvision torchaudio cudatoolkit=${cuda_ver} -c pytorch -y"


# Source: https://pytorch.org/get-started/previous-versions/
#
# CUDA 10.2
#conda install pytorch==1.11.0 torchvision==0.12.0 torchaudio==0.11.0 cudatoolkit=10.2 -c pytorch
# CUDA 11.3
#conda install pytorch==1.11.0 torchvision==0.12.0 torchaudio==0.11.0 cudatoolkit=11.3 -c pytorch
