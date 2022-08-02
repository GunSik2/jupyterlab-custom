FROM cgshome2/scipy-notebook

RUN rm -rf /opt/conda/lib/python3.7/site-packages/jupyterlab/static
COPY static /opt/conda/lib/python3.7/site-packages/jupyterlab/static/
USER root
RUN chmod -R 755 /opt/conda/lib/python3.7/site-packages/jupyterlab/static
USER ${NB_UID}
