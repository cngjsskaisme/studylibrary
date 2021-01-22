import os    
from chardet import detect

srcfile = "~/Documents/Patents_TSVs/brf_sum_text.tsv"

# get file encoding type
def get_encoding_type(file):
    with open(file, 'rb') as f:
        rawdata = f.read()
    return detect(rawdata)['encoding']

from_codec = get_encoding_type(srcfile)

# add try: except block for reliability
try: 
    with open(srcfile, 'r', encoding=from_codec) as f, open(srcfile + "conv.tsv", 'w', encoding='utf-8') as e:
        text = f.read() # for small files, for big use chunks
        e.write(text)

except UnicodeDecodeError:
    print('Decode Error')
except UnicodeEncodeError:
    print('Encode Error')

