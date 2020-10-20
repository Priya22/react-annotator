import os 

def create_folder():
    os.mkdir('~/ATTACK/')
    with open('~/ATTACK/booo.txt', 'w') as f:
        print("JK JK", file=f)
    
    with open('~/ATTACK/booo.txt', 'r') as f:
        lines = f.readlines()
    print(lines)

if  __name__ == '__main__':
    create_folder()