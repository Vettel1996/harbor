## Configuration file of Harbor

#This attribute is for migrator to detect the version of the .cfg file, DO NOT MODIFY!
_version: 1.7.0
#The IP address or hostname to access admin UI and registry service.
#DO NOT use localhost or 127.0.0.1, because Harbor needs to be accessed by external clients.
#DO NOT comment out this line, modify the value of "hostname" directly, or the installation will fail.
hostname: $hostname

#The protocol for accessing the UI and token/notification service, by default it is http.
#It can be set to https if ssl is enabled on nginx.
ui_url_protocol: $ui_url_protocol

#Maximum number of job workers in job service  
max_job_workers: 10

#Determine whether or not to generate certificate for the registry's token.
#If the value is on, the prepare script creates new root cert and private key 
#for generating token to access the registry. If the value is off the default key/cert will be used.
#This flag also controls the creation of the notary signer's cert.
customize_crt: $customize_crt

# The default data volume
data_volume: /data

#The path of cert and key files for nginx, they are applied only the protocol is set to https
ssl_cert: $ssl_cert
ssl_cert_key: $ssl_cert_key

#The path of secretkey storage
secretkey_path: $secretkey_path

#Admiral's url, comment this attribute, or set its value to NA when Harbor is standalone
admiral_url: $admiral_url

log:
  #Log files are rotated log_rotate_count times before being removed. If count is 0, old versions are removed rather than rotated.
  rotate_count: $log_rotate_count
  #Log files are rotated only if they grow bigger than log_rotate_size bytes. If size is followed by k, the size is assumed to be in kilobytes. 
  #If the M is used, the size is in megabytes, and if G is used, the size is in gigabytes. So size 100, size 100k, size 100M and size 100G 
  #are all valid.
  rotate_size: $log_rotate_size

  # The directory that store log files
  location: /var/log/harbor

#NOTES: The properties between BEGIN INITIAL PROPERTIES and END INITIAL PROPERTIES
#only take effect in the first boot, the subsequent changes of these properties 
#should be performed on web ui

##The initial password of Harbor admin, only works for the first time when Harbor starts.
#It has no effect after the first launch of Harbor.
#Change the admin password from UI after launching Harbor.
harbor_admin_password: Harbor12345

database:
  #The address of the Harbor database. Only need to change when using external db.
  host: $db_host
  #The port of Harbor database host
  port: $db_port
  #The user name of Harbor database
  username: $db_user
  #The password for the root user of Harbor DB. Change this before any production use.
  password: $db_password

redis:
  # Redis connection address
  redis_host: redis
  # Redis connection port
  redis_port: 6379
  # Redis connection password
  redis_password:
  # Redis connection db index
  # db_index 1,2,3 is for registry, jobservice and chartmuseum. 
  # db_index 0 is for UI, it's unchangeable
  redis_db_index: 1,2,3

clair:
  #Clair DB host address. Only change it when using an exteral DB.
  db_host: $clair_db_host
  #The password of the Clair's postgres database. Only effective when Harbor is deployed with Clair.
  #Please update it before deployment. Subsequent update will cause Clair's API server and Harbor unable to access Clair's database.
  db_password: $clair_db_password
  #Clair DB connect port
  db_port: $clair_db_port
  #Clair DB username
  db_username: $clair_db_username
  #Clair default database
  db: $clair_db
  #The interval of clair updaters, the unit is hour, set to 0 to disable the updaters.
  updaters_interval: 12
  #Config http proxy for Clair, e.g. http://my.proxy.com:3128
  #Clair doesn't need to connect to harbor internal components via http proxy.
  http_proxy: $http_proxy
  https_proxy: $https_proxy
  no_proxy: $no_proxy

storage:
  #Please be aware that the following storage settings will be applied to both docker registry and helm chart repository.
  #registry_storage_provider can be: filesystem, s3, gcs, azure, etc.
  registry_storage_provider_name: $registry_storage_provider_name
  #registry_storage_provider_config is a comma separated "key: value" pairs, e.g. "key1: value, key2: value2".
  #To avoid duplicated configurations, both docker registry and chart repository follow the same storage configuration specifications of docker registry.
  #Refer to https://docs.docker.com/registry/configuration/#storage for all available configuration.
  registry_storage_provider_config: $registry_storage_provider_config
  #registry_custom_ca_bundle is the path to the custom root ca certificate, which will be injected into the truststore
  #of registry's and chart repository's containers.  This is usually needed when the user hosts a internal storage with self signed certificate.
  registry_custom_ca_bundle:

#If reload_config=true, all settings which present in harbor.yml take effect after prepare and restart harbor, it overwrites exsiting settings.
#reload_config=true
#Regular expression to match skipped environment variables
#skip_reload_env_pattern: (^EMAIL.*)|(^LDAP.*)

