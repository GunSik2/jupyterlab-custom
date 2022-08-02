FROM cgshome2/secure-notebook

ARG cuda_ver=11.3
RUN /bin/bash -c "conda install pytorch torchvision torchaudio cudatoolkit=${cuda_ver} -c pytorch -y"
