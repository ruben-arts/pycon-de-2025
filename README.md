# Demo workspace for PyCon DE 2025
This workspace contains multiple sub packages that are all written in different languages.

They are glued together into one environment by `pixi` and use as bindings by Python.

The `validate.py` file contains collects all the python bindings into one file and shows that you can run the build libraries. 

The `test.mojo` shows that you can run Mojo code in this environment and also call to the python binings from that code. 

The `src/node_project` contains the code to get the timings from the build steps on `conda-forge` comparing `conda-build` to `rattler-build`.

