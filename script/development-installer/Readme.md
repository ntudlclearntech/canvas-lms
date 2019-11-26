# Device Environment
    Operating system:
        Distributor ID: Ubuntu
        Description:    Ubuntu 16.04.6 LTS
        Release:        16.04
        Codename:       xenial
    CPU: 4
    RAM: 8G

# Setup
1) Before start, you have to clone the canvas-lms project
    
    `git clone https://gitlab.dlc.ntu.edu.tw/ntu-cool/canvas-lms.git`

2) Install expect by following command

    `sudo apt install expect`

3) Go to the directory

    `cd canvas-lms/script/development-installer`

4) Setup configuration

    `vim canvas_development_installer.exp`
    
    **Modify these following config on *canvas_development_installer.exp***
    >1.  set your_device_password "*DEVICE PASSWORD*"
    >2.  set your_canvas_username "*SITE ADMIN NAME*"
    >3.  set your_canvas_password "*SITE ADMIN PASSWORD (at least 8 characters)*"
    
    > your_canvas_password at least 8 characters
    
    > your_canvas_password at least 8 characters
    
    > your_canvas_password at least 8 characters
    
    
    
4) Run
    `./canvas_development_installer.exp`

# Run canvas
1) Run canvas as development mode

    `cd /var/canvas`
    
    `bundle exec rails s`
    >  Default port is **3000**, you can change it to **7122** (1024~65536) and run by
    >  `bundle exec rails s -p 7122`
    
    > If you wanted to bind to public IP
    > `bundle exec rails s -p 7122 -b 0.0.0.0`
    
2) If you wanted user upload/download somethings, you have to start up the delay_job

    `cd /var/canvas`
    
    `bundle exec ./script/delayed_job run`
    
    > If you're using bind mode, example: bundle exec rails s -p 7122
    > then you have to modify /var/canvas/config/domain.yml
    
    `development:`
    
    `   domain: "x.x.x.x:7122"`
    
    > x.x.x.x is your device public ip, default is localhost:3000