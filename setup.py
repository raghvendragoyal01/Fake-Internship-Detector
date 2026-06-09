from setuptools import find_packages, setup

setup(
    name='antigravity',
    version='0.1.0',
    description='Fake Internship and Job Scam Detection System',
    author='Antigravity ML Team',
    packages=find_packages(),
    install_requires=[
        'pandas>=2.0.0',
        'numpy>=1.24.0',
        'scikit-learn>=1.3.0',
        'xgboost>=2.0.0',
        'joblib>=1.3.0',
    ],
)
